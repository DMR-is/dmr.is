/**
 * The legacy-PDF redirect is the only non-literal controller path in the repo,
 * and it was written with the optional-parameter suffix `:id?`.
 *
 * path-to-regexp 8, which Express 5 (and therefore Nest 11's
 * `@nestjs/platform-express`) uses, removed that suffix: `/legacy-pdf/:id?`
 * throws `PathError: Unexpected ? at index 15` while the route is being
 * registered, i.e. the API does not boot at all. Nest 11's
 * `LegacyRouteConverter` rewrites `*`, `+` and `(.*)` but has no rule for `?`.
 *
 * A path array registers the two concrete URLs instead, which path-to-regexp
 * 0.1.x and 8.x both accept. Measured on @nestjs/core 11.1.29 / express 5.2.1 /
 * path-to-regexp 8.4.2 in a throwaway project, and on the Express 4 tree here
 * by the tests below.
 *
 * Both URLs matter in production: the parameter form is the modern one, and the
 * bare `/legacy-pdf?recordid=...` form is what the pre-migration Official
 * Journal site published, with case-insensitive query keys.
 */
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import { VersioningType } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CaseServiceMock,
  ICaseService,
  IJournalService,
  IReindexRunnerService,
  MockRunnerService,
} from '@dmr.is/ojoi-modules'
import { ResultWrapper } from '@dmr.is/types'

import { JournalController } from './journal.controller'
import { LeanSearchTrackingService } from './lean-search-tracking.service'

import { Client } from '@opensearch-project/opensearch'

const REDIRECT_TARGET = 'https://example.invalid/legacy.pdf'

describe('GET /legacy-pdf (Express 5 path syntax)', () => {
  let app: INestApplication
  const handleLegacyPdfUrl = jest.fn()

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [JournalController],
      providers: [
        { provide: IJournalService, useValue: { handleLegacyPdfUrl } },
        { provide: ICaseService, useClass: CaseServiceMock },
        { provide: IReindexRunnerService, useClass: MockRunnerService },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        { provide: Client, useValue: { search: jest.fn() } },
        { provide: LeanSearchTrackingService, useValue: { track: jest.fn() } },
      ],
    }).compile()

    // Same global prefix and URI versioning as src/main.ts, so the URLs under
    // test are the ones production serves.
    app = module.createNestApplication()
    app.setGlobalPrefix('api')
    app.enableVersioning({ type: VersioningType.URI })
    await app.init()
  }, 60000)

  afterAll(async () => {
    await app?.close()
  })

  beforeEach(() => {
    handleLegacyPdfUrl.mockReset()
    handleLegacyPdfUrl.mockResolvedValue(
      ResultWrapper.ok({ url: REDIRECT_TARGET }),
    )
  })

  it('SPECIFIED: resolves the path-parameter form and redirects 301', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/legacy-pdf/abc-123',
    )

    expect(res.status).toBe(301)
    expect(res.headers.location).toBe(REDIRECT_TARGET)
    expect(handleLegacyPdfUrl).toHaveBeenCalledWith('abc-123')
  })

  it('SPECIFIED: resolves the bare form and falls back to ?recordid=', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/legacy-pdf?RecordID=abc-123',
    )

    // Upper-case key on purpose: the handler lower-cases every query key
    // because the legacy URLs were not case-sensitive. This only works if the
    // parameter-less path resolves at all.
    expect(res.status).toBe(301)
    expect(res.headers.location).toBe(REDIRECT_TARGET)
    expect(handleLegacyPdfUrl).toHaveBeenCalledWith('abc-123')
  })

  it('SPECIFIED: resolves the bare form and falls back to ?documentid=', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/legacy-pdf?DocumentID=def-456',
    )

    expect(res.status).toBe(301)
    expect(handleLegacyPdfUrl).toHaveBeenCalledWith('def-456')
  })

  it('SPECIFIED: the path parameter wins over the query fallback', async () => {
    await request(app.getHttpServer()).get(
      '/api/v1/legacy-pdf/from-path?recordid=from-query',
    )

    expect(handleLegacyPdfUrl).toHaveBeenCalledWith('from-path')
  })

  it('SPECIFIED: the bare form with no id at all still reaches the handler', async () => {
    // `handleLegacyPdfUrl(undefined)` is what the service already receives for
    // this case today -- the route resolving is what is under test.
    await request(app.getHttpServer()).get('/api/v1/legacy-pdf')

    expect(handleLegacyPdfUrl).toHaveBeenCalledWith(undefined)
  })

  it('SPECIFIED: a missing url is a 404, not a redirect to nowhere', async () => {
    handleLegacyPdfUrl.mockResolvedValue(ResultWrapper.ok({ url: '' }))

    const res = await request(app.getHttpServer()).get(
      '/api/v1/legacy-pdf/abc-123',
    )

    expect(res.status).toBe(404)
  })

  it('SPECIFIED: neither path is registered with a trailing optional marker', () => {
    // Direct guard on the decorator: `Reflect` sees exactly the two literal
    // paths, so a revert to `':id?'` fails here even before a request is made.
    const paths: unknown = Reflect.getMetadata(
      'path',
      JournalController.prototype.getLegacyPdfPath,
    )

    expect(paths).toEqual(['/legacy-pdf', '/legacy-pdf/:id'])
  })
})
