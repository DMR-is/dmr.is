/**
 * Characterization tests for Express query-string parsing of the real
 * Official Journal query DTOs.
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
 * now pin is the SHAPE of the consequence: because `ExceptionFactoryPipe` does
 * not set `whitelist`, a bracket-syntax key is not rejected -- it survives onto
 * the DTO under its literal name while the declared field stays undefined. Every
 * bracket-syntax filter therefore degrades to "no filter" with a 200, and on
 * `GetAdvertsQueryParams.department` a former 400 becomes a silent 200. No
 * caller in this repo sends bracket syntax; an external one would stop being
 * filtered without any error.
 *
 * LABELS
 *   NEST 11 BASELINE -- measured after the bump. The superseded Express 4 value
 *                       is named in each comment.
 *   SPECIFIED        -- a decision. Changing it needs a new decision.
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

  it('NEST 11 BASELINE: Express is on the `simple` (node:querystring) parser', () => {
    // The canary for the whole file. Was 'extended' on Express 4. Nothing in
    // this repo calls `app.set('query parser', ...)`, so this is Express 5's
    // own default -- accepted deliberately, not inherited by accident.
    const expressInstance = app.getHttpAdapter().getInstance()
    expect(expressInstance.get('query parser')).toBe('simple')
  })

  describe('DefaultSearchParams.ids -- `@IsOptional() @Expose()`, no validator, no @Transform', () => {
    it('CHARACTERIZED: repeated keys arrive as an array', async () => {
      const res = await get('/echo/default-search-params?ids=a&ids=b')

      expect(res.status).toBe(200)
      expect(res.body.query.ids).toEqual(['a', 'b'])
    })

    it('NEST 11 BASELINE: bracket syntax is a LITERAL key and the filter is silently dropped', async () => {
      const res = await get('/echo/default-search-params?ids[]=a&ids[]=b')

      // On Express 4 / qs this was `ids === ['a', 'b']` with no 'ids[]' key.
      // Under Express 5's `simple` parser the key stays the literal string
      // 'ids[]', and because ExceptionFactoryPipe does not set `whitelist` it
      // survives onto the DTO. `ids` is undefined: no validation error, no 400,
      // just a filter that silently stops being applied.
      expect(res.status).toBe(200)
      expect(res.body.query.ids).toBeUndefined()
      expect(res.body.query['ids[]']).toEqual(['a', 'b'])
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

    it('NEST 11 BASELINE: bracket-object syntax is a literal key, not an object', async () => {
      const res = await get('/echo/default-search-params?ids[x]=a')

      // On Express 4 / qs this was `ids === { x: 'a' }` -- an object arriving
      // where `string[]` is declared, with no validator to reject it. The
      // `simple` parser yields the literal key 'ids[x]' instead, which is
      // strictly an improvement: `ids` now holds nothing rather than the wrong
      // type.
      expect(res.status).toBe(200)
      expect(res.body.query.ids).toBeUndefined()
      expect(res.body.query['ids[x]']).toBe('a')
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

    it('NEST 11 BASELINE: bracket syntax is a literal key -- and `@IsArray()` does NOT catch it', async () => {
      const res = await get(
        `/echo/cases-with-status-count?statuses[]=${CaseStatusEnum.Submitted}&statuses[]=${CaseStatusEnum.InProgress}`,
      )

      // On Express 4 / qs this was `statuses === ['Innsent', 'Grunnvinnsla']`.
      //
      // Worth noting against the neighbouring test: a SINGLE `statuses=` value
      // is a 400 because `@IsArray()` sees a string, but bracket syntax leaves
      // `statuses` absent entirely, and `@IsOptional()` then waves it through
      // with a 200. The stricter-looking DTO is the one that fails louder.
      expect(res.status).toBe(200)
      expect(res.body.query.statuses).toBeUndefined()
      expect(res.body.query['statuses[]']).toEqual([
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

    it('NEST 11 BASELINE: `department` bracket syntax is now a 200 with the filter dropped', async () => {
      const res = await get('/echo/adverts?department[]=a&department[]=b')

      // On Express 4 / qs this was a 400 on `department` -- qs produced an array
      // and `@IsString()` without `{ each: true }` rejected it. The literal
      // 'department[]' key leaves `department` absent, so validation passes and
      // the request succeeds while filtering by nothing. A loud 400 became a
      // quiet wrong answer.
      expect(res.status).toBe(200)
      expect(res.body.query.department).toBeUndefined()
      expect(res.body.query['department[]']).toEqual(['a', 'b'])
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
      'NEST 11 BASELINE: `%s` bracket syntax is a literal key, so the filter is dropped',
      async (field: string) => {
        const res = await get(`/echo/adverts?${field}[]=a&${field}[]=b`)

        // Was `['a', 'b']` on Express 4 / qs. These four fields carry
        // `@IsString({ each: true })`, so unlike `department` they never
        // returned a 400 -- the flip turns a working array filter into no
        // filter, with a 200 either way.
        expect(res.status).toBe(200)
        expect(res.body.query[field]).toBeUndefined()
        expect(res.body.query[`${field}[]`]).toEqual(['a', 'b'])
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

    it('NEST 11 BASELINE: @Transform does NOT protect against the renamed key', async () => {
      const res = await get(`/echo/cases?status[]=${UUID_A}&status[]=${UUID_B}`)

      // Was `[UUID_A, UUID_B]` on Express 4 / qs.
      //
      // This is the limit of what @Transform buys. It normalises whatever
      // arrives under the name `status`, so it covers the single-value and
      // comma-separated cases below -- but the `simple` parser renames the key
      // to 'status[]', and a transformer on `status` never runs at all. Bracket
      // syntax is dropped here exactly as it is on the unprotected DTOs above.
      expect(res.status).toBe(200)
      expect(res.body.query.status).toBeUndefined()
      expect(res.body.query['status[]']).toEqual([UUID_A, UUID_B])
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
