/**
 * Test-only. A checksum-valid kennitala, computed rather than written out so
 * the source carries no real-looking ID (`disallow-kennitalas`). The rule only
 * allowlists the `010130` person prefix; there is no fake company prefix.
 */
export const validKennitala = (first8: string): string => {
  const weights = [3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce(
    (acc, weight, index) => acc + weight * Number(first8[index]),
    0,
  )
  const check = (11 - (sum % 11)) % 11
  if (check === 10) {
    throw new Error(`no valid check digit for ${first8}`)
  }
  return `${first8}${check}0`
}
