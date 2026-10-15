/**
 * Native replacement for lodash/chunk.
 * Splits an array into groups of `size`. The last group holds the remainder.
 *
 *   chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: ReadonlyArray<T>, size = 1): T[][] {
  const result: T[][] = []
  let index = 0

  while (index < array.length) {
    result.push(array.slice(index, index + size))
    index += size
  }

  return result
}

export default chunk
