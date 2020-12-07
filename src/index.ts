import { minBy } from 'lodash';

/**
 * Async iterator reader.
 * Keeps last read value and retrive the next one when the slot is empty.
 */
type IterReader<T> = {
  iter: AsyncIterableIterator<T>;
  current?: T;
  done?: boolean;
  fill: () => Promise<IterReader<T> | undefined>;
};

/**
 * Merge multiple async iterables into one, sorting the items order
 * according to provided criterion.
 *
 * It is assumed, that all input iterables are already sorted by this
 * sorting criterion.
 */
export function asyncItersMergeSort<T>(
  asyncIters: AsyncIterableIterator<T>[],
  compareFunction: (a: T) => any = (x: T) => 0,
): AsyncIterableIterator<T> {
  let readers: IterReader<T>[] = asyncIters.map(
    (iter) =>
      ({
        iter,
        // Refill the slot with next value from underlying iterable
        // whenever the slot is empty
        async fill() {
          if (!this.done && this.current === undefined) {
            const iterResult = await this.iter.next();
            this.current = iterResult.value;
            this.done = iterResult.done;
          }
          return this.done ? undefined : this;
        },
      } as IterReader<T>),
  );

  return (async function* () {
    while (true) {
      // update readers and get rid of finished ones
      readers = (
        await Promise.all(readers.map(async (reader) => reader.fill()))
      ).filter(
        (reader): reader is IterReader<T> =>
          reader !== undefined && !reader.done,
      );

      if (readers.length === 0) {
        // stop the generator
        return;
      }

      // Sorting: choose the reader with minimal payload value
      const compareReader = (reader: IterReader<T>): number =>
        reader?.current === undefined ? 0 : compareFunction(reader.current);
      const minReader = minBy<IterReader<T>>(readers, compareReader);

      if (minReader !== undefined && minReader.current !== undefined) {
        // give out current value from this reader
        yield minReader.current;
        // free up its slot for the next value
        minReader.current = undefined;
      } else {
        // just in case: stop the generator on fail to get a value
        return;
      }
    }
  })();
}
