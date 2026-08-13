/**
 * Characterization tests for Express query-string parsing of the real
 * Official Journal query DTOs.
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
 * Every test in this file runs the DTO through `ExceptionFactoryPipe()`, the
 * global pipe of all three official-journal APIs
 * (`apps/official-journal-{,admin-,application-}api/src/main.ts`). It is a
 * `ValidationPipe` with `transform: true` and `enableDebugMessages: true`;
 * notably `whitelist` is NOT set, so unknown query keys survive onto the
 * DTO instance rather than being stripped.
 */
import request from 'supertest'

import type { INestApplication } from '@nestjs/common'
import { Controller, Get, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { ExceptionFactoryPipe } from '@dmr.is/pipelines'
import {
  CaseStatusEnum,
  DefaultSearchParams,
  GetAdvertsQueryParams,
  GetCasesQuery,
  GetCasesWithStatusCountQuery,
} from '@dmr.is/shared-dto'

/*
 * A throwaway controller that only echoes what the pipe produced. Using the
 * real DTO classes but not the real controllers keeps auth guards and the
 * database out of the picture -- what is under test is Express's query parser
 * plus class-transformer/class-validator, nothing else.
 *
 * eslint-disable is deliberate: the auth-decorator rule exists to protect
 * real endpoints, and this controller is never mounted outside this file.
 */
 
@Controller('echo')
class EchoController {
  @Get('default-search-params')
  defaultSearchParams(@Query() query: DefaultSearchParams) {
    return { query }
  }

  @Get('cases-with-status-count')
  casesWithStatusCount(@Query() query: GetCasesWithStatusCountQuery) {
    return { query }
  }

  @Get('adverts')
  adverts(@Query() query: GetAdvertsQueryParams) {
    return { query }
  }

  @Get('cases')
  cases(@Query() query: GetCasesQuery) {
    return { query }
  }
}
 

const UUID_A = '11111111-1111-4111-8111-111111111111'
const UUID_B = '22222222-2222-4222-8222-222222222222'

describe('query-string parsing (official-journal DTOs, ExceptionFactoryPipe)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EchoController],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(ExceptionFactoryPipe())
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

  describe('DefaultSearchParams.ids -- `@IsOptional() @Expose()`, no validator, no @Transform', () => {
    it('CHARACTERIZED: repeated keys arrive as an array', async () => {
      const res = await get('/echo/default-search-params?ids=a&ids=b')

      expect(res.status).toBe(200)
      expect(res.body.query.ids).toEqual(['a', 'b'])
    })

    it('CHARACTERIZED: bracket syntax also arrives as an array (qs only -- this is what the Express 5 flip breaks)', async () => {
      const res = await get('/echo/default-search-params?ids[]=a&ids[]=b')

      expect(res.status).toBe(200)
      expect(res.body.query.ids).toEqual(['a', 'b'])
      // Under Express 5's `simple` parser the key becomes the literal
      // string 'ids[]'. Since ExceptionFactoryPipe does not set
      // `whitelist`, that literal key will survive onto the DTO and `ids`
      // will be undefined -- no validation error, just a dropped filter.
      expect(res.body.query['ids[]']).toBeUndefined()
    })

    it('CHARACTERIZED: a single value arrives as a bare string, NOT a one-element array', async () => {
      const res = await get('/echo/default-search-params?ids=a')

      expect(res.status).toBe(200)
      // `ids` is declared `string[]` but nothing validates or normalises it,
      // so a scalar reaches the service under an array-typed name. This is a
      // pre-existing type-safety hole, not something the Express 5 flip
      // introduces.
      expect(res.body.query.ids).toBe('a')
      expect(Array.isArray(res.body.query.ids)).toBe(false)
    })

    it('CHARACTERIZED: bracket-object syntax reaches the DTO as an object (qs only)', async () => {
      const res = await get('/echo/default-search-params?ids[x]=a')

      expect(res.status).toBe(200)
      // An object arrives where `string[]` is declared, and no validator
      // rejects it. Express 5's `simple` parser would turn this into the
      // literal key 'ids[x]' instead -- strictly an improvement here.
      expect(res.body.query.ids).toEqual({ x: 'a' })
    })

    it('CHARACTERIZED: a comma-separated value is NOT split (no @Transform on this field)', async () => {
      const res = await get('/echo/default-search-params?ids=a,b')

      expect(res.status).toBe(200)
      expect(res.body.query.ids).toBe('a,b')
    })
  })

  describe('GetCasesWithStatusCountQuery.statuses -- `@IsArray() @IsEnum(..., { each: true })`, no @Transform', () => {
    it('CHARACTERIZED: repeated keys arrive as an array and validate', async () => {
      const res = await get(
        `/echo/cases-with-status-count?statuses=${CaseStatusEnum.Submitted}&statuses=${CaseStatusEnum.InProgress}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.query.statuses).toEqual([
        CaseStatusEnum.Submitted,
        CaseStatusEnum.InProgress,
      ])
    })

    it('CHARACTERIZED: bracket syntax also arrives as an array (qs only)', async () => {
      const res = await get(
        `/echo/cases-with-status-count?statuses[]=${CaseStatusEnum.Submitted}&statuses[]=${CaseStatusEnum.InProgress}`,
      )

      expect(res.status).toBe(200)
      expect(res.body.query.statuses).toEqual([
        CaseStatusEnum.Submitted,
        CaseStatusEnum.InProgress,
      ])
    })

    it('CHARACTERIZED: a SINGLE status is rejected with 400 -- `@IsArray()` with no @Transform to wrap it', async () => {
      const res = await get(
        `/echo/cases-with-status-count?statuses=${CaseStatusEnum.Submitted}`,
      )

      // Filtering by exactly one status is a 400 today. This is a latent bug
      // in the DTO, unrelated to the parser flip: the field is reachable only
      // by callers that always send two or more values.
      expect(res.status).toBe(400)
      expect(res.body.message).toEqual([
        {
          property: 'statuses',
          constraints: { isArray: 'statuses must be an array' },
        },
      ])
    })

    it('CHARACTERIZED: a comma-separated list is rejected with 400 (no @Transform to split it)', async () => {
      const res = await get(
        `/echo/cases-with-status-count?statuses=${CaseStatusEnum.Submitted},${CaseStatusEnum.InProgress}`,
      )

      expect(res.status).toBe(400)
      expect(res.body.message[0].property).toBe('statuses')
      expect(res.body.message[0].constraints).toHaveProperty('isArray')
    })
  })

  describe('GetAdvertsQueryParams -- five `string | string[]` fields, no @Transform', () => {
    it('CHARACTERIZED: `department` REJECTS repeated keys with 400 -- it is `@IsString()` without `{ each: true }`', async () => {
      const res = await get('/echo/adverts?department=a&department=b')

      // The other four fields on this DTO carry `@IsString({ each: true })`;
      // `department` (get-adverts-query.dto.ts:51) does not. So the documented
      // `type: [String]` and the `string | string[]` TS type are both wrong
      // for it -- multi-department filtering is a 400 today. Latent bug,
      // independent of the parser flip.
      expect(res.status).toBe(400)
      expect(res.body.message).toEqual([
        {
          property: 'department',
          constraints: { isString: 'department must be a string' },
        },
      ])
    })

    it('CHARACTERIZED: `department` REJECTS bracket syntax with the same 400', async () => {
      const res = await get('/echo/adverts?department[]=a&department[]=b')

      expect(res.status).toBe(400)
      expect(res.body.message[0].property).toBe('department')
    })

    it('CHARACTERIZED: `department` accepts a single value as a bare string', async () => {
      const res = await get('/echo/adverts?department=a')

      expect(res.status).toBe(200)
      expect(res.body.query.department).toBe('a')
    })

    it.each([
      ['type'],
      ['mainType'],
      ['category'],
      ['involvedParty'],
    ])(
      'CHARACTERIZED: `%s` accepts repeated keys as an array',
      async (field: string) => {
        const res = await get(`/echo/adverts?${field}=a&${field}=b`)

        expect(res.status).toBe(200)
        expect(res.body.query[field]).toEqual(['a', 'b'])
      },
    )

    it.each([
      ['type'],
      ['mainType'],
      ['category'],
      ['involvedParty'],
    ])(
      'CHARACTERIZED: `%s` accepts bracket syntax as an array (qs only)',
      async (field: string) => {
        const res = await get(`/echo/adverts?${field}[]=a&${field}[]=b`)

        expect(res.status).toBe(200)
        expect(res.body.query[field]).toEqual(['a', 'b'])
      },
    )

    it.each([
      ['type'],
      ['mainType'],
      ['category'],
      ['involvedParty'],
    ])(
      'CHARACTERIZED: `%s` accepts a single value as a bare string -- `{ each: true }` does not reject non-arrays',
      async (field: string) => {
        const res = await get(`/echo/adverts?${field}=a`)

        expect(res.status).toBe(200)
        expect(res.body.query[field]).toBe('a')
        expect(Array.isArray(res.body.query[field])).toBe(false)
      },
    )
  })

  describe('CONTRAST: GetCasesQuery -- the same shape but WITH a @Transform normaliser', () => {
    // get-cases-query.dto.ts does
    //   @Transform(({ value }) => Array.isArray(value) ? value : value?.split(','))
    // on id/status/department/type/category. These tests exist to prove the
    // unprotected-DTO tests above are measuring something real: a
    // @Transform-protected field is immune to the whole question.

    it('CHARACTERIZED: repeated keys arrive as an array', async () => {
      const res = await get(`/echo/cases?status=${UUID_A}&status=${UUID_B}`)

      expect(res.status).toBe(200)
      expect(res.body.query.status).toEqual([UUID_A, UUID_B])
    })

    it('CHARACTERIZED: bracket syntax arrives as an array (qs only)', async () => {
      const res = await get(`/echo/cases?status[]=${UUID_A}&status[]=${UUID_B}`)

      expect(res.status).toBe(200)
      expect(res.body.query.status).toEqual([UUID_A, UUID_B])
    })

    it('SPECIFIED: a single value is normalised UP to a one-element array', async () => {
      const res = await get(`/echo/cases?status=${UUID_A}`)

      // This is what @Transform buys, and the difference from
      // DefaultSearchParams.ids / GetPublicationsQueryDto.categoryId, which
      // both leak a bare string here.
      expect(res.status).toBe(200)
      expect(res.body.query.status).toEqual([UUID_A])
    })

    it('SPECIFIED: a comma-separated value is split into an array', async () => {
      const res = await get(`/echo/cases?status=${UUID_A},${UUID_B}`)

      expect(res.status).toBe(200)
      expect(res.body.query.status).toEqual([UUID_A, UUID_B])
    })

    it('SPECIFIED: `id` behaves identically -- single value normalised up', async () => {
      const res = await get(`/echo/cases?id=${UUID_A}`)

      expect(res.status).toBe(200)
      expect(res.body.query.id).toEqual([UUID_A])
    })
  })
})
