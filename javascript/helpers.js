'use strict';

/** App-agnostic utility functions. */

// Calculates all possible sums of an array of number arrays
// Example: calculateSums([[5], [1, 11]]) will return [6, 16]
export function calculateSums(arrays) {
  return arrays.reduce((acc, curr) => {
    const sums = [];

    acc.forEach(sum => {
      curr.forEach(num => sums.push(sum + num));
    });

    return sums;
  }, [0]);
}

export function withTimeout(callback, ms) {
  return new Promise(resolve => setTimeout(() => {
    callback();
    resolve();
  }, ms));
}

// Based on https://stackoverflow.com/a/12646864
export function shuffledArray(array) {
  const shuffledArray = structuredClone(array);

  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
}
