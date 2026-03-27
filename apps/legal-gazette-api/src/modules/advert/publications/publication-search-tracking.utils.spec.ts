import { GetPublicationsQueryDto } from './dto/publication.dto'
import {
  PublicationSearchAdvertVersion,
  PublicationSearchQueryKind,
  PublicationSearchTrackingEventDto,
  PublicationSearchTrackingFiltersDto,
} from './dto/publication-search-tracking.dto'
import {
  buildPublicationSearchTrackingEvent,
  classifyPublicationSearchQuery,
  normalizePublicationSearchFilters,
} from './publication-search-tracking.utils'

const buildQuery = (
  overrides: Partial<GetPublicationsQueryDto> = {},
): GetPublicationsQueryDto =>
  Object.assign(new GetPublicationsQueryDto(), {
    page: 1,
    pageSize: 20,
    ...overrides,
  })

describe('publication-search-tracking utils', () => {
  describe('classifyPublicationSearchQuery', () => {
    it('classifies empty queries', () => {
      expect(classifyPublicationSearchQuery('   ')).toEqual({
        normalizedQuery: null,
        queryHash: null,
        queryKind: PublicationSearchQueryKind.Empty,
        queryLength: 0,
        queryTokenCount: 0,
      })
    })

    it('classifies free-text queries and collapses whitespace', () => {
      const result = classifyPublicationSearchQuery('  Hello   World  ')

      expect(result).toEqual({
        normalizedQuery: 'hello world',
        queryHash: expect.any(String),
        queryKind: PublicationSearchQueryKind.FreeText,
        queryLength: 11,
        queryTokenCount: 2,
      })
    })

    it('classifies 11 digit publication numbers', () => {
      const result = classifyPublicationSearchQuery('12345678901')

      expect(result).toEqual({
        normalizedQuery: '12345678901',
        queryHash: expect.any(String),
        queryKind: PublicationSearchQueryKind.PublicationNumber,
        queryLength: 11,
        queryTokenCount: 1,
      })
    })
  })

  describe('normalizePublicationSearchFilters', () => {
    it('normalizes date and category filters into stable values', () => {
      expect(
        normalizePublicationSearchFilters(
          buildQuery({
          advertId: '11111111-1111-4111-8111-111111111111',
          typeId: '22222222-2222-4222-8222-222222222222',
          categoryId: [
            '44444444-4444-4444-8444-444444444444',
            '33333333-3333-4333-8333-333333333333',
            '33333333-3333-4333-8333-333333333333',
          ],
          dateFrom: new Date('2026-03-01T00:00:00.000Z'),
          dateTo: new Date('2026-03-31T23:59:59.000Z'),
          version:
            PublicationSearchAdvertVersion.B as GetPublicationsQueryDto['version'],
        }),
        ),
      ).toEqual(
        Object.assign(new PublicationSearchTrackingFiltersDto(), {
          advertId: '11111111-1111-4111-8111-111111111111',
          typeId: '22222222-2222-4222-8222-222222222222',
          categoryId: [
            '33333333-3333-4333-8333-333333333333',
            '44444444-4444-4444-8444-444444444444',
          ],
          dateFrom: '2026-03-01T00:00:00.000Z',
          dateTo: '2026-03-31T23:59:59.000Z',
          version: PublicationSearchAdvertVersion.B,
        }),
      )
    })
  })

  describe('buildPublicationSearchTrackingEvent', () => {
    it('builds a full tracking payload', () => {
      expect(
        buildPublicationSearchTrackingEvent(
          buildQuery({
            search: ' 12345678901 ',
            categoryId: [
              '44444444-4444-4444-8444-444444444444',
              '33333333-3333-4333-8333-333333333333',
            ],
            version:
              PublicationSearchAdvertVersion.C as GetPublicationsQueryDto['version'],
          }),
          {
            page: 2,
            pageSize: 50,
            pageResultCount: 3,
            totalResultCount: 10,
            durationMs: 42,
          },
        ),
      ).toEqual(
        Object.assign(new PublicationSearchTrackingEventDto(), {
          route: '/api/v1/publications',
          backend: 'postgres',
          createdAt: expect.any(Date),
          normalizedQuery: '12345678901',
          queryHash: expect.any(String),
          queryKind: PublicationSearchQueryKind.PublicationNumber,
          queryLength: 11,
          queryTokenCount: 1,
          hasFilters: true,
          filters: Object.assign(new PublicationSearchTrackingFiltersDto(), {
            categoryId: [
              '33333333-3333-4333-8333-333333333333',
              '44444444-4444-4444-8444-444444444444',
            ],
            version: PublicationSearchAdvertVersion.C,
          }),
          page: 2,
          pageSize: 50,
          pageResultCount: 3,
          totalResultCount: 10,
          durationMs: 42,
        }),
      )
    })
  })
})
