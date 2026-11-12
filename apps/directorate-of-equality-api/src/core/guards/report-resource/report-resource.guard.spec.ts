/* eslint-disable local-rules/disallow-kennitalas */
import { ForbiddenException } from '@nestjs/common'

import { ReportRoleEnum, ReportStatusEnum } from '@dmr.is/doe-modules/report'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { CompanyReadTokenSurface } from '../../decorators/company-read-token-surface.decorator'
import {
  ISLAND_IS_APPLICATION_SCOPE,
  MY_PAGES_SCOPE,
} from '../token-surface/token-surface'
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

// The comment routes, as the controller declares them: reading is open to My
// Pages, posting and deleting are not.
class CommentRoutes {
  @CompanyReadTokenSurface()
  list() {
    return null
  }

  create() {
    return null
  }
}

const createExecutionContext = (
  request: Record<string, unknown>,
  handler: 'list' | 'create' = 'create',
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => CommentRoutes.prototype[handler],
    getClass: () => CommentRoutes,
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

  describe('My Pages tokens on the company side', () => {
    const myPagesUser = (nationalId: string): DMRUser =>
      ({ ...createCompanyUser(nationalId), scope: [MY_PAGES_SCOPE] }) as DMRUser

    it('reads a report the company owns', async () => {
      const request: Record<string, unknown> = {
        params: { reportId: 'report-1' },
        user: myPagesUser('5500000000'),
      }
      authorizationService.resolveReportResourceContext.mockResolvedValue(
        companyContext,
      )

      await expect(
        guard.canActivate(createExecutionContext(request, 'list')),
      ).resolves.toBe(true)
      expect(request.reportResourceContext).toBe(companyContext)
    })

    it('is refused on a write, such as posting a comment', async () => {
      const request: Record<string, unknown> = {
        params: { reportId: 'report-1' },
        user: myPagesUser('5500000000'),
      }
      authorizationService.resolveReportResourceContext.mockResolvedValue(
        companyContext,
      )

      await expect(
        guard.canActivate(createExecutionContext(request, 'create')),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(request.reportResourceContext).toBeUndefined()
    })

    // A read marker widens the company side only: reviewer authority still
    // comes from doe-web alone.
    it('never gets reviewer access, even on a read', async () => {
      const request: Record<string, unknown> = {
        params: { reportId: 'report-1' },
        user: myPagesUser('1111111111'),
      }
      authorizationService.resolveReportResourceContext.mockResolvedValue(
        reviewerContext,
      )

      await expect(
        guard.canActivate(createExecutionContext(request, 'list')),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })
})
