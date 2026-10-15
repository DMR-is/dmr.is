/**
 * Native replacement for lodash/chunk.
 * Splits an array into groups of `size`. The last group holds the remainder.
 * Like lodash, `size` is truncated to an integer, and a size below 1 returns [].
 *
 *   chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: ReadonlyArray<T>, size = 1): T[][] {
  // `|| 0` maps NaN to 0, since Math.max(NaN, 0) is NaN
  const step = Math.max(Math.trunc(size) || 0, 0)
  if (!array.length || step < 1) return []

  const result: T[][] = []
  let index = 0

  while (index < array.length) {
    result.push(array.slice(index, index + step))
    index += step
  }

  return result
}

export default chunk
