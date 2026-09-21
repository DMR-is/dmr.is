// Publication-number shapes shared by the search query builder and the search
// analytics, for the same reason `extractPhrase` is: when the two hold their
// own regexes they drift, and a query ends up recorded as one kind while it
// executes as another.
//
// Both callers already trim their input, but they normalise it differently, so
// these collapse it themselves rather than trusting the caller.

// A complete `number/year`. The year being exactly four digits is what keeps
// this and the prefix pattern below from ever matching the same input.
const PUBLICATION_NUMBER_PATTERN = /^(\d+)\s*\/\s*(\d{4})\s*$/

// A publication number the user has not finished typing: the serial on its
// own, optionally followed by a slash and an incomplete year. Search runs on
// every keystroke, so `1009/2010` is typed through five intermediate states
// and four of them are this shape.
//
// The 1-5 digit cap is a guard rather than tidiness. `publicationNumber.number`
// is mapped `integer`, and an 11-digit internal case number in a term query
// against it is outside int32 - OpenSearch answers with a
// number_format_exception rather than with zero hits. No real serial number
// comes near five digits.
const PUBLICATION_NUMBER_PREFIX_PATTERN = /^(\d{1,5})(?:\s*\/\s*(\d{0,3}))?\s*$/

const collapse = (value?: string): string =>
  (value ?? '').trim().replace(/\s+/g, ' ')

export type PublicationNumberMatch = {
  /** Serial number with any leading zeros dropped. */
  number: string
  year: string
  /** `number/year`, matching how `publicationNumber.full` is indexed. */
  full: string
}

export const matchPublicationNumber = (
  value?: string,
): PublicationNumberMatch | null => {
  const match = collapse(value).match(PUBLICATION_NUMBER_PATTERN)

  if (!match) return null

  const number = String(parseInt(match[1], 10))
  const year = match[2]

  return { number, year, full: `${number}/${year}` }
}

/**
 * The serial number from a publication number that is still being typed, with
 * any leading zeros dropped. Returns null for a complete `number/year`, which
 * `matchPublicationNumber` owns.
 */
export const matchPublicationNumberPrefix = (value?: string): string | null => {
  const collapsed = collapse(value)

  if (PUBLICATION_NUMBER_PATTERN.test(collapsed)) return null

  const match = collapsed.match(PUBLICATION_NUMBER_PREFIX_PATTERN)

  return match ? String(parseInt(match[1], 10)) : null
}
