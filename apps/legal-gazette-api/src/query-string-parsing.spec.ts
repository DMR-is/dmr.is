/**
 * Characterization tests for Express query-string parsing of the real Legal
 * Gazette query DTOs.
 *
 * WHY THIS EXISTS
 * Nest 11 ships `@nestjs/platform-express` with Express 5, whose default
 * `query parser` setting changes from `extended` (qs) to `simple`
 * (node:querystring). Measured across the bump:
 *   - `?a=1&a=2`     still yields `['1','2']`         (UNCHANGED)
 *   - `?a=1`         still yields `'1'`               (UNCHANGED)
 *   - `?a[]=1&a[]=2` yields the literal key `'a[]'`   (CHANGED)
 *   - `?a[b]=1`      yields the literal key `'a[b]'`  (CHANGED)
 *
 * Accepting the `simple` parser is a decision already taken. What these tests
 * now pin is the SHAPE of the consequence for this app: `whitelist: true` strips
 * the renamed key, so a bracket-syntax filter vanishes with a 200 and no error
 * of any kind. No caller in this repo sends bracket syntax; an external one
 * would stop being filtered silently.
 *
 * LABELS
 *   NEST 11 BASELINE -- measured after the bump. The superseded Express 4 value
 *                       is named in each comment.
 *   SPECIFIED        -- a decision. Changing it needs a new decision.
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

  it('NEST 11 BASELINE: Express is on the `simple` (node:querystring) parser', () => {
    // The canary for the whole file. Was 'extended' on Express 4. Nothing in
    // this repo calls `app.set('query parser', ...)`, so this is Express 5's
    // own default -- accepted deliberately, not inherited by accident.
    const expressInstance = app.getHttpAdapter().getInstance()
    expect(expressInstance.get('query parser')).toBe('simple')
  })

  describe('GetPublicationsQueryDto.categoryId -- `@IsUUID(\'4\', { each: true })`, no @IsArray, no @Transform', () => {
    it('CHARACTERIZED: repeated keys arrive as an array', async () => {
      const res = await get(
        `/echo/publications?categoryId=${UUID_A}&categoryId=${UUID_B}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.query.categoryId).toEqual([UUID_A, UUID_B])
    })

    it('NEST 11 BASELINE: bracket syntax is stripped by `whitelist` and the filter disappears', async () => {
      const res = await get(
        `/echo/publications?categoryId[]=${UUID_A}&categoryId[]=${UUID_B}`,
      )

      // Was `[UUID_A, UUID_B]` on Express 4 / qs.
      //
      // The `simple` parser renames the key to the literal 'categoryId[]', which
      // `whitelist: true` then strips. So BOTH names are absent: 200, no
      // validation error, and the category filter silently gone. Legal Gazette
      // is quieter about this than the official-journal APIs, which have no
      // `whitelist` and so keep the literal key on the DTO.
      expect(res.status).toBe(200)
      expect(res.body.query.categoryId).toBeUndefined()
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

    it('NEST 11 BASELINE: bracket syntax is stripped -- and `@IsArray()` does NOT catch it', async () => {
      const res = await get(
        `/echo/types?excludeTypes[]=${UUID_A}&excludeTypes[]=${UUID_B}`,
      )

      // Was `[UUID_A, UUID_B]` on Express 4 / qs.
      //
      // Worth reading against the next test: a SINGLE `excludeTypes=` value is a
      // 400 because `@IsArray()` sees a string, but bracket syntax leaves the
      // field absent and `@IsOptional()` waves it through with a 200. The
      // stricter-looking DTO is the one that fails louder.
      expect(res.status).toBe(200)
      expect(res.body.query.excludeTypes).toBeUndefined()
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
