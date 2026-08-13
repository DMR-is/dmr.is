/**
 * Characterization tests for Express query-string parsing of the real Legal
 * Gazette query DTOs.
 *
 * WHY THIS EXISTS
 * Nest 11 ships `@nestjs/platform-express` with Express 5, whose default
 * `query parser` setting changes from `extended` (qs) to `simple`
 * (node:querystring). Under `simple`:
 *   - `?a=1&a=2`     still yields `['1','2']`         (unchanged)
 *   - `?a[]=1&a[]=2` yields the literal key `'a[]'`   (CHANGES)
 *   - `?a[b]=1`      yields the literal key `'a[b]'`  (CHANGES)
 * Accepting the `simple` parser is a decision already taken. These tests do
 * not prevent that change -- they record what Express 4 does today so the
 * effect of the flip is visible instead of silent.
 *
 * LABELS
 *   CHARACTERIZED -- measured against Express 4 / Nest 10 as committed. A
 *                    later reader is allowed to change these once the parser
 *                    flips, as long as the change is deliberate.
 *   SPECIFIED     -- a decision. Changing it needs a new decision.
 *
 * PIPE
 * Every test in this file runs the DTO through the exact global pipe from
 * `apps/legal-gazette-api/src/main.ts`. Two of its options matter here:
 *   - `whitelist: true` strips unknown query keys SILENTLY, with no 400. That
 *     is what makes the Express 5 flip quiet rather than loud for this app:
 *     `?categoryId[]=x` becomes the unknown key `categoryId[]`, gets stripped,
 *     and the filter simply disappears.
 *   - `transformOptions.enableImplicitConversion: true` coerces by the
 *     declared TS type -- but note below that it does NOT wrap scalars into
 *     arrays for `string[]` fields.
 */
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import { Controller, Get, Query, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { GetPublicationsQueryDto } from './modules/advert/publications/dto/publication.dto'
import { GetTypesQueryDto } from './modules/base-entity/dto/base-entity-query.dto'

/*
 * A throwaway controller that only echoes what the pipe produced. Using the
 * real DTO classes but not the real controllers keeps auth guards and the
 * database out of the picture -- what is under test is Express's query parser
 * plus class-transformer/class-validator, nothing else.
 *
 * eslint-disable is deliberate: the auth-decorator rule exists to protect
 * real endpoints, and this controller is never mounted outside this file.
 */
/* eslint-disable local-rules/require-controller-auth-decorators */
@Controller('echo')
class EchoController {
  @Get('publications')
  publications(@Query() query: GetPublicationsQueryDto) {
    return { query }
  }

  @Get('types')
  types(@Query() query: GetTypesQueryDto) {
    return { query }
  }
}
/* eslint-enable local-rules/require-controller-auth-decorators */

const UUID_A = '11111111-1111-4111-8111-111111111111'
const UUID_B = '22222222-2222-4222-8222-222222222222'

describe('query-string parsing (legal-gazette DTOs, main.ts ValidationPipe)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EchoController],
    }).compile()

    app = moduleRef.createNestApplication()
    // Mirrors apps/legal-gazette-api/src/main.ts exactly.
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        enableDebugMessages: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const get = (url: string) => request(app.getHttpServer()).get(url)

  it('CHARACTERIZED: Express is on the `extended` (qs) query parser', () => {
    // This is the canary for the whole file. Express 4 defaults to
    // `extended`; Express 5 defaults to `simple`. When this assertion fails,
    // every CHARACTERIZED bracket-syntax expectation below is expected to
    // fail with it.
    const expressInstance = app.getHttpAdapter().getInstance()
    expect(expressInstance.get('query parser')).toBe('extended')
  })

  describe('GetPublicationsQueryDto.categoryId -- `@IsUUID(\'4\', { each: true })`, no @IsArray, no @Transform', () => {
    it('CHARACTERIZED: repeated keys arrive as an array', async () => {
      const res = await get(
        `/echo/publications?categoryId=${UUID_A}&categoryId=${UUID_B}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.query.categoryId).toEqual([UUID_A, UUID_B])
    })

    it('CHARACTERIZED: bracket syntax also arrives as an array (qs only -- this is what the Express 5 flip breaks)', async () => {
      const res = await get(
        `/echo/publications?categoryId[]=${UUID_A}&categoryId[]=${UUID_B}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.query.categoryId).toEqual([UUID_A, UUID_B])
      // Under Express 5's `simple` parser the key becomes the literal string
      // 'categoryId[]', which `whitelist: true` then strips. The request
      // still returns 200 -- the category filter is just gone.
      expect(res.body.query['categoryId[]']).toBeUndefined()
    })

    it('CHARACTERIZED: a single value arrives as a bare string, NOT a one-element array', async () => {
      const res = await get(`/echo/publications?categoryId=${UUID_A}`)

      expect(res.status).toBe(200)
      // `enableImplicitConversion` does not wrap a scalar for a `string[]`
      // field, and there is no @IsArray to reject it, so a bare string
      // reaches `advert.service.ts:1103` as `{ [Op.in]: query.categoryId }`.
      // Latent bug, independent of the parser flip.
      expect(res.body.query.categoryId).toBe(UUID_A)
      expect(Array.isArray(res.body.query.categoryId)).toBe(false)
    })

    it('CHARACTERIZED: a comma-separated value is rejected with 400 (no @Transform to split it)', async () => {
      const res = await get(`/echo/publications?categoryId=${UUID_A},${UUID_B}`)

      expect(res.status).toBe(400)
      expect(res.body.message).toEqual(['each value in categoryId must be a UUID'])
    })

    it('CHARACTERIZED: `whitelist: true` strips an unknown key silently, with no 400', async () => {
      const res = await get(
        `/echo/publications?bogus=1&categoryId=${UUID_A}`,
      )

      // Pinned because it is the mechanism that will make the Express 5 flip
      // silent for this app: a bracketed key becomes unknown, and unknown
      // keys do not raise.
      expect(res.status).toBe(200)
      expect(res.body.query.bogus).toBeUndefined()
      expect(res.body.query.categoryId).toBe(UUID_A)
    })
  })

  describe('GetTypesQueryDto.excludeTypes -- `@IsArray() @IsUUID(undefined, { each: true })`, no @Transform', () => {
    it('CHARACTERIZED: repeated keys arrive as an array', async () => {
      const res = await get(
        `/echo/types?excludeTypes=${UUID_A}&excludeTypes=${UUID_B}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.query.excludeTypes).toEqual([UUID_A, UUID_B])
    })

    it('CHARACTERIZED: bracket syntax also arrives as an array (qs only)', async () => {
      const res = await get(
        `/echo/types?excludeTypes[]=${UUID_A}&excludeTypes[]=${UUID_B}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.query.excludeTypes).toEqual([UUID_A, UUID_B])
      expect(res.body.query['excludeTypes[]']).toBeUndefined()
    })

    it('CHARACTERIZED: a SINGLE value is rejected with 400 -- `@IsArray()` with no @Transform to wrap it', async () => {
      const res = await get(`/echo/types?excludeTypes=${UUID_A}`)

      // Excluding exactly one type is a 400 today. Same latent bug shape as
      // GetCasesWithStatusCountQuery.statuses in the official-journal DTOs.
      expect(res.status).toBe(400)
      expect(res.body.message).toEqual(['excludeTypes must be an array'])
    })

    it('CHARACTERIZED: a comma-separated list is rejected with 400', async () => {
      const res = await get(`/echo/types?excludeTypes=${UUID_A},${UUID_B}`)

      expect(res.status).toBe(400)
      expect(res.body.message).toContain('excludeTypes must be an array')
    })
  })
})
