import { minBy } from 'lodash';

// a narrowed version of same named type from lodash
type ValueIteratee<T> = (value: T) => unknown;

/**
 * Async iterator reader.
 * Keeps last read value.
 */
interface IterReader<T> {
  iter: AsyncIterableIterator<T>;
  current: T | undefined;
  done: boolean;
}

interface IterReaderWithVal<T> extends IterReader<T> {
  current: T;
}

/**
 * Refills a single reader when it's slot is empty and providing
 * the underlying iterable is not yet exhausted
 */
async function refill<T>(reader: IterReader<T>): Promise<IterReader<T>> {
  if (reader.current !== undefined || reader.done) {
    return reader;
  }
  const iterResult: IteratorResult<T, T | undefined> = await reader.iter.next();
  return {
    iter: reader.iter,
    current: iterResult.value,
    done: Boolean(iterResult.done),
  };
}

/**
 * Refills all the readers and get rid of exhausted ones
 */
async function updateReaders<T>(
  readers: IterReader<T>[],
): Promise<IterReaderWithVal<T>[]> {
  return (await Promise.all(readers.map(refill))).filter(
    (reader): reader is IterReaderWithVal<T> =>
      !reader.done && reader?.current !== undefined,
  );
}

/**
 * Merge multiple async iterables into one, sorting the items
 * according to the provided criterion.
 *
 * It is assumed, that all input iterables are themselves sorted by
 * same sorting criterion.
 */
export function asyncItersMergeSort<T>(
  asyncIters: AsyncIterableIterator<T>[],
  compareFunction?: ValueIteratee<T>,
): AsyncIterableIterator<T> {
  return (async function* () {
    // keep active readers here
    let readers = await updateReaders(
      asyncIters.map((iter) => ({
        iter,
        current: undefined,
        done: false,
      })),
    );

    while (true) {
      if (readers.length === 0) {
        // stop the generator
        return;
      }

      let selectedReader: IterReaderWithVal<T> | undefined;

      if (compareFunction === undefined) {
        // No sorting rule is specified, let's concatenate sources one by one,
        // starting with lowest index. When source with 0 index gets exhausted
        // it gets shifted out of readers list, so that next source becomes
        // zero indexed and consumed here, and so forth.
        selectedReader = readers[0];
      } else {
        // Apply sorting rule to choose the reader with minimal current
        // payload value
        const compareReader = (reader: IterReaderWithVal<T>): any =>
          compareFunction(reader.current);

        selectedReader = minBy<IterReaderWithVal<T>>(readers, compareReader);
      }

      if (selectedReader?.current === undefined) {
        // just in case: stop the generator on fail to get a value
        return;
      }

      // give out current value from this reader
      yield selectedReader.current;
      // free up its slot for the next value
      (selectedReader as IterReader<T>).current = undefined;

      // refill readers and get rid of finished ones
      readers = await updateReaders(readers);
    }
  })();
}
