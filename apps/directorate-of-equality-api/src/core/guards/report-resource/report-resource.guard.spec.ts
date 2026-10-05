/* eslint-disable local-rules/disallow-kennitalas */
import { ForbiddenException } from '@nestjs/common'

import { ReportRoleEnum, ReportStatusEnum } from '@dmr.is/doe-modules/report'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { ISLAND_IS_APPLICATION_SCOPE } from '../token-surface/token-surface'
import { ReportResourceGuard } from './report-resource.guard'

const STAFF_CLIENT_ID = 'doe-web-client'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// doe-web's id_token: no scope, audience is doe-web.
const createStaffUser = (nationalId: string): DMRUser =>
  ({
    nationalId,
    name: 'Test User',
    fullName: 'Test User',
    client: 'test',
    authorization: 'Bearer test',
    aud: STAFF_CLIENT_ID,
  }) as unknown as DMRUser

// An island.is application access token.
const createCompanyUser = (nationalId: string): DMRUser =>
  ({
    nationalId,
    name: 'Test Company',
    fullName: 'Test Company',
    scope: [ISLAND_IS_APPLICATION_SCOPE],
    client: 'test',
    authorization: 'Bearer test',
  }) as DMRUser

const reviewerContext = {
  reportId: 'report-1',
  reportStatus: ReportStatusEnum.IN_REVIEW,
  actor: { kind: ReportRoleEnum.REVIEWER, userId: 'reviewer-1' },
}

const companyContext = {
  reportId: 'report-1',
  reportStatus: ReportStatusEnum.SUBMITTED,
  actor: { kind: ReportRoleEnum.COMPANY, nationalId: '5500000000' },
}

const createExecutionContext = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as never

describe('ReportResourceGuard', () => {
  const authorizationService = {
    resolveReportResourceContext: jest.fn(),
  }

  let guard: ReportResourceGuard

  const originalClientId = process.env.DOE_WEB_CLIENT_ID

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DOE_WEB_CLIENT_ID = STAFF_CLIENT_ID
    guard = new ReportResourceGuard(
      logger as never,
      authorizationService as never,
    )
  })

  afterAll(() => {
    if (originalClientId === undefined) {
      delete process.env.DOE_WEB_CLIENT_ID
    } else {
      process.env.DOE_WEB_CLIENT_ID = originalClientId
    }
  })

  it('attaches reviewer resource context to the request', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createStaffUser('1201743399'),
    }

    authorizationService.resolveReportResourceContext.mockResolvedValue(
      reviewerContext,
    )

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.reportResourceContext).toBe(reviewerContext)
    expect(
      authorizationService.resolveReportResourceContext,
    ).toHaveBeenCalledWith('report-1', '1201743399')
  })

  it('attaches contact resource context when the report contact matches', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createCompanyUser('5500000000'),
    }

    authorizationService.resolveReportResourceContext.mockResolvedValue(
      companyContext,
    )

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.reportResourceContext).toBe(companyContext)
  })

  // A company-channel token carrying a reviewer's kennitala must not get
  // reviewer access: reviewer authority comes only from doe-web.
  it('refuses reviewer access on a token not issued to doe-web', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createCompanyUser('1201743399'),
    }

    authorizationService.resolveReportResourceContext.mockResolvedValue(
      reviewerContext,
    )

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(request.reportResourceContext).toBeUndefined()
  })

  it('refuses reviewer access to a delegated session', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: {
        ...createStaffUser('1201743399'),
        actor: { nationalId: '1111111111', name: 'Delegate', scope: [] },
      },
    }

    authorizationService.resolveReportResourceContext.mockResolvedValue(
      reviewerContext,
    )

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(request.reportResourceContext).toBeUndefined()
  })

  it('refuses company access on a token without a company scope', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createStaffUser('5500000000'),
    }

    authorizationService.resolveReportResourceContext.mockResolvedValue(
      companyContext,
    )

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(request.reportResourceContext).toBeUndefined()
  })

  it('rejects users without report access', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createStaffUser('1201743399'),
    }

    authorizationService.resolveReportResourceContext.mockRejectedValue(
      new ForbiddenException(
        'Current user is not allowed to access this report',
      ),
    )

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
