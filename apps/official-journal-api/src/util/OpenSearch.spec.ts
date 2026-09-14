import { getOsBody } from './OpenSearch'

const mustOf = (search: string) => getOsBody({ search }).body.query.bool.must
const shouldOf = (search: string) =>
  getOsBody({ search }).body.query.bool.should

const phraseClauses = (clauses: any[]) =>
  clauses.filter((c) => c?.multi_match?.type === 'phrase')

const bagOfWordsClauses = (clauses: any[]) =>
  clauses.filter((c) => c?.multi_match?.type === 'most_fields')

describe('getOsBody', () => {
  describe('quoted phrase queries', () => {
    it('requires the phrase instead of OR-ing the tokens', () => {
      const must = mustOf('"three little words"')

      expect(bagOfWordsClauses(must)).toHaveLength(0)
      expect(phraseClauses(must)).toHaveLength(1)
      expect(must[0].multi_match).toMatchObject({
        query: 'three little words',
        type: 'phrase',
        slop: 0,
      })
    })

    it('does not carry a boost, so it filters rather than ranks', () => {
      expect(
        mustOf('"three little words"')[0].multi_match.boost,
      ).toBeUndefined()
    })

    it('never phrase-matches on the decompounded field', () => {
      const fields = mustOf('"three little words"')[0].multi_match.fields

      expect(fields.some((f: string) => f.includes('.compound'))).toBe(false)
    })

    it('treats a quoted publication number literally', () => {
      // The number/year boosts are for unquoted lookups. Quoting means "these
      // characters, adjacent", so the special path must stay out of it.
      expect(shouldOf('"123/2024"')).toHaveLength(0)
      expect(phraseClauses(mustOf('"123/2024"'))).toHaveLength(1)
    })

    it.each([
      ['two quoted segments', '"lög" "um veiðar"'],
      ['quoted segments joined by a word', '"lög" og "veiðar"'],
      ['a leading quoted segment', 'lög "um veiðar"'],
      ['a bare quote character', '"""'],
    ])('does not treat %s as a phrase', (_label, search) => {
      // Only a fully quoted query is a phrase. The old greedy `.+` matched
      // the two-segment shapes and collapsed them into a single strict
      // adjacency over tokens never meant to be adjacent; the other rows
      // already fell through and are here to keep it that way.
      expect(phraseClauses(mustOf(search))).toHaveLength(0)
      expect(bagOfWordsClauses(mustOf(search))).toHaveLength(1)
    })

    it('detects a phrase the same way whatever the whitespace', () => {
      expect(mustOf('"three   little\nwords"')[0].multi_match).toMatchObject({
        query: 'three little words',
        type: 'phrase',
      })
    })

    it('falls back to normal search when the quotes are empty', () => {
      expect(bagOfWordsClauses(mustOf('""'))).toHaveLength(1)
      expect(bagOfWordsClauses(mustOf('"   "'))).toHaveLength(1)
    })
  })

  describe('phrase ranking on unquoted queries', () => {
    it('boosts adjacency without touching recall', () => {
      const must = mustOf('three little words')
      const should = shouldOf('three little words')

      // Recall is still decided by the unchanged OR query.
      expect(bagOfWordsClauses(must)).toHaveLength(1)
      expect(must[0].multi_match.operator).toBe('or')

      const [phrase] = phraseClauses(should)
      expect(phrase.multi_match).toMatchObject({
        query: 'three little words',
        type: 'phrase',
      })
      expect(phrase.multi_match.boost).toBeGreaterThan(1)
    })

    it('adds no phrase clause for a single-word query', () => {
      expect(phraseClauses(shouldOf('reglugerd'))).toHaveLength(0)
    })
  })

  describe('term coverage', () => {
    it('requires a share of the terms rather than any single one', () => {
      const [bag] = bagOfWordsClauses(mustOf('three little words'))

      expect(bag.multi_match.minimum_should_match).toBe('75%')
    })

    it('applies the same threshold regardless of term count', () => {
      // `buildTextQuery` emits the constant unconditionally. The floor to 1 at
      // two terms - which is what protects the cross-field case - is computed
      // by OpenSearch at query time and cannot be exercised from a unit test.
      // This pins the wiring, not that guarantee.
      const [bag] = bagOfWordsClauses(mustOf('reglugerd veidar'))

      expect(bag.multi_match.minimum_should_match).toBe('75%')
      expect(bag.multi_match.operator).toBe('or')
    })

    it('does not apply term coverage to a quoted phrase', () => {
      expect(
        mustOf('"three little words"')[0].multi_match.minimum_should_match,
      ).toBeUndefined()
    })
  })

  describe('existing behaviour is unchanged', () => {
    it('still boosts publication numbers', () => {
      const should = shouldOf('123/2024')

      expect(should.some((c: any) => c?.term?.['publicationNumber.full'])).toBe(
        true,
      )
    })

    it('still boosts internal case numbers', () => {
      expect(
        shouldOf('12345678901').some((c: any) => c?.term?.caseNumber),
      ).toBe(true)
    })

    it('still handles prefix wildcards', () => {
      const must = mustOf('reglu*')

      expect(JSON.stringify(must)).toContain('match_phrase_prefix')
    })

    it('prefix-matches unstemmed fields, not only stemmed ones', () => {
      // A fragment has no predictable stem, and the stopword filter can delete
      // it outright, so the plain fields have to be in the mix.
      const clauses = mustOf('reglu*')[0].bool.should
      const fields = clauses.map(
        (c: any) => Object.keys(c.match_phrase_prefix)[0],
      )

      expect(fields).toContain('title')
      expect(fields).toContain('involvedParty.title')
      expect(fields).toContain('title.stemmed')
      expect(fields).toContain('involvedParty.title.stemmed')
    })

    it('keeps the prefix clause satisfiable by any one field', () => {
      expect(mustOf('reglu*')[0].bool.minimum_should_match).toBe(1)
    })

    it('still matches everything when the query is empty', () => {
      expect(mustOf('')).toEqual([{ match_all: {} }])
    })
  })
})
