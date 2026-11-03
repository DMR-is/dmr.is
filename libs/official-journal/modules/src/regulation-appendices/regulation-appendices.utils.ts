import { matchPublicationNumber } from '../search/query/query-shape'

export type ParsedPublicationNumber = {
  /** `number/year`, the form the response echoes back. */
  full: string
  number: number
  year: number
}

export type ParsePublicationNumbersResult =
  | { ok: true; value: ParsedPublicationNumber[] }
  | { ok: false; invalid: string[] }

// `serial_number` is an int4 column. A serial past int32 makes Postgres fail
// the whole query instead of matching nothing, and no real serial number comes
// near five digits - the same cap the search prefix pattern uses.
const MAX_SERIAL_DIGITS = 5

/**
 * Normalize the requested publication numbers through the same parser the
 * search uses, so `01000 / 2026` and `1000/2026` are one lookup.
 *
 * Any malformed entry rejects the whole request rather than being dropped:
 * an importer that sent a bad number should hear about it, not receive a
 * response that silently has fewer entries than it asked for.
 *
 * Duplicates collapse to one entry, kept at the position of their first
 * occurrence.
 */
export const parsePublicationNumbers = (
  values: string[],
): ParsePublicationNumbersResult => {
  const invalid: string[] = []
  const parsed = new Map<string, ParsedPublicationNumber>()

  for (const value of values) {
    const match = matchPublicationNumber(value)

    if (!match || match.number.length > MAX_SERIAL_DIGITS) {
      invalid.push(value)
      continue
    }

    if (!parsed.has(match.full)) {
      parsed.set(match.full, {
        full: match.full,
        number: Number(match.number),
        year: Number(match.year),
      })
    }
  }

  if (invalid.length > 0) {
    return { ok: false, invalid }
  }

  return { ok: true, value: [...parsed.values()] }
}

/**
 * Group serial numbers by year so the lookup is one `serial_number IN (...)`
 * per year rather than one OR arm per publication number.
 */
export const groupSerialsByYear = (
  numbers: ParsedPublicationNumber[],
): Map<number, number[]> => {
  const byYear = new Map<number, number[]>()

  for (const { number, year } of numbers) {
    const serials = byYear.get(year) ?? []
    serials.push(number)
    byYear.set(year, serials)
  }

  return byYear
}
