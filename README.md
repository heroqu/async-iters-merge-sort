# Merge Async Iterables with Sorting

Merge multiple async iterables into a single async iterable, ordered according to sorting rule provided.

It is implied that source iterables are themselves already ordered by the same sorting criterion. See _Explanation_ section below for exact meaning of sorting being applied.

## Usage

Simple example:

```javascript
const { asyncItersMergeSort } = require('async-iters-merge-sort');
// or, in ES6 or TS:
// import { asyncItersMergeSort } from 'async-iters-merge-sort';

// a little helper to prepare sources
async function* arrayToAsyncIter(arr) {
  yield* arr;
}

// let's say we have 3 async iterators as sources:
const sources = [
  [10, 20, 30],
  [21, 41, 61],
  [32, 52, 72],
].map(arrayToAsyncIter);

// Now we merge them with simple "natural" sorting:
const sortFn = (x) => x;
const mergedSorted = asyncItersMergeSort(sources, sortFn);

// and then consume to see what we've just got:
(async () => {
  for await (const x of mergedSorted) {
    console.log(x);
  }
})();

// output:
// 10
// 20
// 21
// 30
// 32
// 41
// 52
// 61
// 72
```

## Explanation

Basically, what is going on under the hood is that we take single next value from each of the sources (async iterables yielding values with arbitrary delays) and compare them according to sorting rule provided, select the 'minimal' one and yield it to the world. The particular source iterator which value was just selected then moves forward and waits for its next value. Then, when all sources are ready again, the selection repeats and so on. Each loop exhausted iterators get removed from the pool and finally, when all sources are exhausted - the resulting iterator gets also stopped.

### Sorting rule functions

User supplied sorting rule function takes single argument and should return a value, that javascript engine is able to compare in a meaninfull way (e.g. number or string). For example, if iterables produce items in a shape of:

```javascript
  {name: 'Donald', order: 10},
  {name: 'Marshall', order: 20}
```

then we can construct some sorting rule like this:

```javascript
const sortFn = (value) => value.order;
```

### Source iterables should be sorted too!

It's important to note, that overall order of items from resulting iterable is only guaranteed if all the input sources themselves do obey the same sorting criterion. This is because at each loop we do only compare and select _current_ values across the sources, having no knowledge of what they are going to yield next.

E.g. if we have serveral sources with timestamped items and we know that in each individual source the timestamp can only grow, then we can apply a sorting rule based on that timestamp:

```javascript
const sortFn = (value) => value.timestamp;
```

and have a guarantee that merged iterable would yield items with timestamp that never decrease.

### Items timing

At each selection round we wait till _all_ of the sources are ready, i.e.  each has received its next value (or got exhausted and put aside). E.g. to yield the very first item it takes to wait till every source gets its first item. From that point on we have to wait till last selected source gets its next item (or gets exhausted).

## One more example

For illustration, let's apply some custom sorting function to merge two async iterables of strings in a special way:

```javascript
import { asyncItersMergeSort } from './index';

async function* arrayToAsyncIter(arr) {
  yield* arr;
}

const sortFn = (ch) => (ch ? -'abcdefghijklmnopqrstuvwxyz'.indexOf(ch) : 1);

// this should sort lowercase latin chars in reversed alphabetical order,
// while leaving capital chars behind and unsorted.

// let's merge two sample sources:
const sources = [
  ['h', 'f', 'c', 'a', 'B', 'A'],
  ['h', 'b', 'C'],
].map(arrayToAsyncIter);

const mergedSorted = asyncItersMergeSorted(sources, sortFn);

(async () => {
  for await (const item of mergedSorted) {
    console.log(item);
  }
})();

// output:
// h
// h
// f
// c
// b
// a
// B
// A
// C
```

Let's take a look how it all worked out:

We can see that lowercase chars are in reversed order as expected. Then we also see, that capital chars in both sources waited till all the lowercase ones were exhausted. Then the selection between 'B' and 'C' took place, but as all the capitals have the same priority, the selection was boiled down to taking an item from the source with lowest index, and this was the first iterable and 'B'. Then in the next loop again it was 'A' vs. 'C' and the 'A' won for the same reason. Then first source got exhausted and finally we got 'C' from the second source in the very last round.

## Typescript support

Type definitions are included in the package.
