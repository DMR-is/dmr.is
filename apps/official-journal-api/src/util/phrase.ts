// Phrase detection shared by the search query builder and the search
// analytics, so the two can never disagree about what counts as a quoted
// search. They previously held separate regexes and matched against
// differently normalised input, which made a query with a newline in it get
// recorded as a phrase but executed as free text.
//
// Only a fully quoted query is a phrase. The character class rather than a
// greedy `.+` is what holds that line: `"lög" og "veiðar"` has to fall through
// to normal search, not collapse into one adjacency over tokens that were
// never meant to be adjacent.
const PHRASE_PATTERN = /^"([^"]+)"$/

export const extractPhrase = (value?: string): string | null => {
  const collapsed = (value ?? '').trim().replace(/\s+/g, ' ')
  const phrase = collapsed.match(PHRASE_PATTERN)?.[1].trim()

  return phrase ? phrase : null
}
