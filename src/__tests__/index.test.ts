import { asyncItersMergeSort } from '../index';

async function* arrayToAsyncIter<T>(arr: T[]) {
  yield* arr;
}

const NUMBERS = [
  [10, 20, 30], // source #1
  [21, 41, 61], // source #2
  [32, 52, 72], // source #3
];
const NUMBERS_REVERSED = NUMBERS.map((nums) => [...nums].reverse());
const STRINGS = NUMBERS.map((nums) => nums.map(String));
const STRINGS_REVERSED = NUMBERS_REVERSED.map((nums) => nums.map(String));

describe('Merge sort async iter of numbers', () => {
  let INPUTS: AsyncGenerator<number, void, undefined>[];
  let INPUTS_REVERSED: AsyncGenerator<number, void, undefined>[];

  beforeEach(() => {
    INPUTS = NUMBERS.map(arrayToAsyncIter);
    INPUTS_REVERSED = NUMBERS_REVERSED.map(arrayToAsyncIter);
  });

  test('Works with no sort', async () => {
    const expected = [10, 20, 30, 21, 41, 61, 32, 52, 72];

    const mergedSorted = asyncItersMergeSort<number>(INPUTS);

    const result: number[] = [];
    for await (const item of mergedSorted) {
      result.push(item);
    }

    expect(result).toEqual(expected);
  });

  test('Works with natural sort', async () => {
    const expected = [10, 20, 21, 30, 32, 41, 52, 61, 72];

    const mergedSorted = asyncItersMergeSort<number>(INPUTS, (item) => item);

    const result: number[] = [];
    for await (const item of mergedSorted) {
      result.push(item);
    }

    expect(result).toEqual(expected);
  });

  test('Works with reverse sort', async () => {
    const expected = [10, 20, 21, 30, 32, 41, 52, 61, 72].reverse();

    const mergedSorted = asyncItersMergeSort<number>(
      INPUTS_REVERSED,
      (item) => -item,
    );

    const result: number[] = [];
    for await (const item of mergedSorted) {
      result.push(item);
    }

    expect(result).toEqual(expected);
  });

  test('Works with some inputs empty', async () => {
    const expected = [10, 20, 21, 30, 32, 41, 52, 61, 72];

    const inputs = [
      arrayToAsyncIter<number>([]),
      ...INPUTS,
      arrayToAsyncIter<number>([]),
    ];

    const mergedSorted = asyncItersMergeSort<number>(inputs, (item) => item);

    const result: number[] = [];
    for await (const item of mergedSorted) {
      result.push(item);
    }

    expect(result).toEqual(expected);
  });

  test('Works with all inputs empty', async () => {
    const expected: number[] = [];

    const inputs = [[], [], []].map(arrayToAsyncIter);

    const mergedSorted = asyncItersMergeSort<number>(inputs, (item) => item);

    const result: number[] = [];
    for await (const item of mergedSorted) {
      result.push(item);
    }

    expect(result).toEqual(expected);
  });

  test('Works with no inputs at all', async () => {
    const expected: number[] = [];

    const inputs: AsyncGenerator<any, void, undefined>[] = [].map(
      arrayToAsyncIter,
    );

    const mergedSorted = asyncItersMergeSort<number>(inputs, (item) => item);

    const result: number[] = [];
    for await (const item of mergedSorted) {
      result.push(item);
    }

    expect(result).toEqual(expected);
  });
});

describe('Merge sort async iter of strings', () => {
  let INPUTS: AsyncGenerator<string, void, undefined>[];
  let INPUTS_REVERSED: AsyncGenerator<string, void, undefined>[];

  beforeEach(() => {
    INPUTS = STRINGS.map(arrayToAsyncIter);
    INPUTS_REVERSED = STRINGS_REVERSED.map(arrayToAsyncIter);
  });

  test('Works with no sort', async () => {
    const expected = [10, 20, 30, 21, 41, 61, 32, 52, 72].map(String);

    const mergedSorted = asyncItersMergeSort<string>(INPUTS);

    const result: string[] = [];
    for await (const x of mergedSorted) {
      result.push(x);
    }

    expect(result).toEqual(expected);
  });

  test('Works with natural sort', async () => {
    const expected = [10, 20, 21, 30, 32, 41, 52, 61, 72].map(String);

    const mergedSorted = asyncItersMergeSort<string>(INPUTS, (x) => x);

    const result: string[] = [];
    for await (const x of mergedSorted) {
      result.push(x);
    }

    expect(result).toEqual(expected);
  });

  test('Works with reverse sort', async () => {
    const expected = [10, 20, 21, 30, 32, 41, 52, 61, 72].reverse().map(String);

    const mergedSorted = asyncItersMergeSort<string>(
      INPUTS_REVERSED,
      (item) => -item,
    );

    const result: string[] = [];
    for await (const item of mergedSorted) {
      result.push(item);
    }

    expect(result).toEqual(expected);
  });
});
