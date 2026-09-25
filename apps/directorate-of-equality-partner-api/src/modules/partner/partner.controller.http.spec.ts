/**
 * The partner controller over real HTTP, through `configureApp` — the same body
 * limits, global `ValidationPipe` and routing `main.ts` applies.
 *
 * `partner.controller.spec.ts` calls handler methods directly, so it cannot see
 * anything the request pipeline does before the handler runs. That blind spot
 * hid a pipe-ordering bug: the global pipe validated the equality route's raw
 * multipart string against the DTO and refused every submission, while every
 * unit spec stayed green. Guards and services are stubbed; what is under test is
 * the pipeline between the socket and the handler.
 */
import request from 'supertest'

import {
  CanActivate,
  ConflictException,
  ExecutionContext,
} from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'

import { IApplicationService } from '@dmr.is/doe-modules/application'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
} from '@dmr.is/shared-filters'

import { configureApp } from '../../configure-app'
import { RequireActiveCompanyGuard } from '../../core/guards/active-company/require-active-company.guard'
import { ApiKeyGuard } from '../../core/guards/api-key/api-key.guard'
import { RequireApiScopeGuard } from '../../core/guards/api-key-scope/require-api-scope.guard'
import {
  ApiKeyThrottlerGuard,
  DryRunThrottlerGuard,
} from '../../core/guards/api-key-throttler/api-key-throttler.guard'
import { PartnerCompanyGuard } from '../../core/guards/partner-company/partner-company.guard'
import { MAX_PARTNER_JSON_BYTES } from '../../request-limits'
import { PartnerSubmissionService } from '../submission/partner-submission.service'
import { PartnerController } from './partner.controller'

const COMPANY = { id: 'company-1', nationalId: '5005101370' }

/** Stands in for ApiKeyGuard + PartnerCompanyGuard: the tenant is resolved. */
const resolvedTenant: CanActivate = {
  canActivate: (ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    req.companyContext = COMPANY
    req.partnerClientId = null
    return true
  },
}
const allow: CanActivate = { canActivate: () => true }

const VALID_PAYLOAD = {
  providerId: 'p-1',
  companyAdminName: 'Anna Admin',
  companyAdminEmail: 'anna@example.is',
  companyAdminGender: 'FEMALE',
  contactName: 'Jón Tengill',
  contactEmail: 'jon@example.is',
  contactPhone: '5551234',
  company: {
    name: 'Prófunarfyrirtæki',
    address: 'Laugavegur 1',
    city: 'Reykjavík',
    postcode: '101',
    isatCategory: '62.01',
  },
}

describe('PartnerController over HTTP', () => {
  let app: NestExpressApplication
  const submitEquality = jest.fn()
  const submitSalary = jest.fn()

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PartnerController],
      providers: [
        { provide: IApplicationService, useValue: {} },
        {
          provide: PartnerSubmissionService,
          useValue: { submitEquality, submitSalary },
        },
        // Registered in the order AppModule registers them.
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue(resolvedTenant)
      .overrideGuard(PartnerCompanyGuard)
      .useValue(allow)
      .overrideGuard(RequireApiScopeGuard)
      .useValue(allow)
      .overrideGuard(RequireActiveCompanyGuard)
      .useValue(allow)
      .overrideGuard(ApiKeyThrottlerGuard)
      .useValue(allow)
      .overrideGuard(DryRunThrottlerGuard)
      .useValue(allow)
      .compile()

    app = module.createNestApplication<NestExpressApplication>({
      logger: false,
    })
    configureApp(app)
    await app.init()
  }, 120000)

  afterAll(async () => {
    await app?.close()
  })

  beforeEach(() => {
    submitEquality.mockReset()
    submitSalary.mockReset()
  })

  describe('POST /partner/reports/equality', () => {
    const DOCX = Buffer.from('not inspected here — the service is stubbed')

    it('hands a valid JSON payload part to the service, parsed', async () => {
      submitEquality.mockResolvedValue({
        reportId: 'r-1',
        replayed: false,
        status: 'SUBMITTED',
      })

      const res = await request(app.getHttpServer())
        .post('/api/v1/partner/reports/equality')
        .field('payload', JSON.stringify(VALID_PAYLOAD))
        .attach('document', DOCX, 'plan.docx')

      expect(res.status).toBe(201)
      expect(submitEquality).toHaveBeenCalledTimes(1)
      expect(submitEquality.mock.calls[0][0]).toMatchObject({
        providerId: 'p-1',
        company: { name: 'Prófunarfyrirtæki' },
      })
    })

    it('answers a missing payload part with the pipe’s own message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/partner/reports/equality')
        .attach('document', DOCX, 'plan.docx')

      expect(res.status).toBe(400)
      expect(res.body.details).toEqual([
        expect.stringContaining('The "payload" part is missing'),
      ])
      expect(submitEquality).not.toHaveBeenCalled()
    })

    it('answers a payload part that is not JSON with the pipe’s own message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/partner/reports/equality')
        .field('payload', 'not json')
        .attach('document', DOCX, 'plan.docx')

      expect(res.status).toBe(400)
      expect(res.body.details).toEqual(['The "payload" part is not valid JSON'])
    })

    it('answers a conflict with a named 409 body', async () => {
      submitEquality.mockRejectedValue(
        new ConflictException('A sibling report is in review'),
      )

      const res = await request(app.getHttpServer())
        .post('/api/v1/partner/reports/equality')
        .field('payload', JSON.stringify(VALID_PAYLOAD))
        .attach('document', DOCX, 'plan.docx')

      expect(res.status).toBe(409)
      expect(res.body).toMatchObject({
        name: 'Conflict',
        message: 'Conflict.',
        details: ['A sibling report is in review'],
      })
    })

    it('still refuses an unknown field inside the part', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/partner/reports/equality')
        .field('payload', JSON.stringify({ ...VALID_PAYLOAD, bogus: 1 }))
        .attach('document', DOCX, 'plan.docx')

      expect(res.status).toBe(400)
      expect(res.body.details).toEqual(['property bogus should not exist'])
      expect(submitEquality).not.toHaveBeenCalled()
    })
  })

  describe('request body limit', () => {
    it('answers a JSON body over the limit with 413, not 500', async () => {
      const oversized = JSON.stringify({
        padding: 'x'.repeat(MAX_PARTNER_JSON_BYTES),
      })

      const res = await request(app.getHttpServer())
        .post('/api/v1/partner/reports/salary')
        .set('Content-Type', 'application/json')
        .send(oversized)

      expect(res.status).toBe(413)
      expect(res.body.name).toBe('PayloadTooLarge')
      expect(submitSalary).not.toHaveBeenCalled()
    })

    it('answers a malformed JSON body with 400, not 500', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/partner/reports/salary')
        .set('Content-Type', 'application/json')
        .send('{"providerId":')

      expect(res.status).toBe(400)
      expect(res.body.name).toBe('BadRequest')
    })
  })
})
