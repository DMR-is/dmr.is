import {
  LeanSearchQueryKind,
  LeanSearchTrackingEventDto,
  LeanSearchTrackingFiltersDto,
} from './lean-search-tracking.dto'
import {
  buildLeanSearchTrackingEvent,
  classifyLeanSearchQuery,
  normalizeLeanSearchFilters,
} from './lean-search-tracking.utils'

describe('lean-search-tracking utils', () => {
  describe('classifyLeanSearchQuery', () => {
    it('classifies empty queries', () => {
      expect(classifyLeanSearchQuery('   ')).toEqual({
        normalizedQuery: null,
        queryKind: LeanSearchQueryKind.Empty,
        queryHash: null,
        queryLength: 0,
        queryTokenCount: 0,
      })
    })

    it('classifies free-text queries and collapses whitespace', () => {
      const result = classifyLeanSearchQuery('  Hello   World  ')

      expect(result).toEqual({
        normalizedQuery: 'hello world',
        queryKind: LeanSearchQueryKind.FreeText,
        queryHash: expect.any(String),
        queryLength: 11,
        queryTokenCount: 2,
      })
    })

    it('classifies internal case numbers', () => {
      const result = classifyLeanSearchQuery('12345678901')

      expect(result).toEqual({
        normalizedQuery: '12345678901',
        queryKind: LeanSearchQueryKind.InternalCaseNumber,
        queryHash: expect.any(String),
        queryLength: 11,
        queryTokenCount: 1,
      })
    })

    it('classifies publication numbers and normalizes spacing', () => {
      const result = classifyLeanSearchQuery('0012 / 2024')

      expect(result).toEqual({
        normalizedQuery: '12/2024',
        queryKind: LeanSearchQueryKind.PublicationNumber,
        queryHash: expect.any(String),
        queryLength: 7,
        queryTokenCount: 1,
      })
    })

    it('classifies fully quoted queries as phrases, without the quotes', () => {
      const result = classifyLeanSearchQuery('"three little words"')

      expect(result).toEqual({
        normalizedQuery: 'three little words',
        queryKind: LeanSearchQueryKind.Phrase,
        queryHash: expect.any(String),
        queryLength: 18,
        queryTokenCount: 3,
      })
    })

    it('hashes a phrase the same as the equivalent free-text query', () => {
      expect(classifyLeanSearchQuery('"three little words"').queryHash).toBe(
        classifyLeanSearchQuery('three little words').queryHash,
      )
    })

    it.each([
      'lög "um veiðar"',
      '"lög" "um veiðar"',
      '"lög" og "veiðar"',
      '"""',
    ])('does not treat partially quoted query %s as a phrase', (search) => {
      const result = classifyLeanSearchQuery(search)

      expect(result.queryKind).toBe(LeanSearchQueryKind.FreeText)
      // The quote characters used to survive into the stored query, so these
      // rows grouped with nothing.
      expect(result.normalizedQuery).toBe(search.toLowerCase())
    })

    it('classifies single-token wildcard queries', () => {
      const result = classifyLeanSearchQuery('search*')

      expect(result).toEqual({
        normalizedQuery: 'search',
        queryKind: LeanSearchQueryKind.PrefixWildcard,
        queryHash: expect.any(String),
        queryLength: 6,
        queryTokenCount: 1,
      })
    })
  })

  describe('normalizeLeanSearchFilters', () => {
    it('normalizes single and multi-value filters into stable arrays', () => {
      expect(
        normalizeLeanSearchFilters({
          department: 'zeta,alpha',
          type: ['type-b', 'type-a', 'type-a'],
          year: '2024',
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
        }),
      ).toEqual(
        Object.assign(new LeanSearchTrackingFiltersDto(), {
          department: ['alpha', 'zeta'],
          type: ['type-a', 'type-b'],
          year: '2024',
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
        }),
      )
    })
  })

  describe('buildLeanSearchTrackingEvent', () => {
    it('builds a full tracking payload', () => {
      expect(
        buildLeanSearchTrackingEvent(
          {
            search: '  Search* ',
            department: ['zeta', 'alpha'],
            sortBy: 'date',
            direction: 'desc',
          },
          {
            page: 2,
            pageSize: 50,
            pageResultCount: 3,
            totalResultCount: 10,
            durationMs: 42,
          },
        ),
      ).toEqual(
        Object.assign(new LeanSearchTrackingEventDto(), {
          route: '/api/v1/adverts-lean',
          backend: 'opensearch',
          normalizedQuery: 'search',
          queryHash: expect.any(String),
          queryKind: LeanSearchQueryKind.PrefixWildcard,
          queryLength: 6,
          queryTokenCount: 1,
          hasFilters: true,
          filters: Object.assign(new LeanSearchTrackingFiltersDto(), {
            department: ['alpha', 'zeta'],
          }),
          page: 2,
          pageSize: 50,
          sortBy: 'date',
          direction: 'DESC',
          pageResultCount: 3,
          totalResultCount: 10,
          durationMs: 42,
        }),
      )
    })
  })
})
