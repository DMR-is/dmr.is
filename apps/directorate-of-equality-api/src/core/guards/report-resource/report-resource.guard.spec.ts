/* eslint-disable local-rules/disallow-kennitalas */
import { ForbiddenException } from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { ReportStatusEnum } from '../../../modules/report/models/report.model'
import { ReportRoleEnum } from '../../../modules/report/types/report-resource-context'
import { ReportResourceGuard } from './report-resource.guard'

const createUser = (nationalId: string): DMRUser =>
  ({
    nationalId,
    name: 'Test User',
    fullName: 'Test User',
    scope: [],
    client: 'test',
    authorization: 'Bearer test',
  }) as DMRUser

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

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new ReportResourceGuard(authorizationService as never)
  })

  it('attaches reviewer resource context to the request', async () => {
    const context = {
      reportId: 'report-1',
      reportStatus: ReportStatusEnum.IN_REVIEW,
      actor: { kind: ReportRoleEnum.REVIEWER, userId: 'reviewer-1' },
    }
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createUser('1201743399'),
    }

    authorizationService.resolveReportResourceContext.mockResolvedValue(context)

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.reportResourceContext).toBe(context)
    expect(
      authorizationService.resolveReportResourceContext,
    ).toHaveBeenCalledWith('report-1', '1201743399')
  })

  it('attaches contact resource context when the report contact matches', async () => {
    const context = {
      reportId: 'report-1',
      reportStatus: ReportStatusEnum.SUBMITTED,
      actor: { kind: ReportRoleEnum.COMPANY, nationalId: '5500000000' },
    }
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createUser('5500000000'),
    }

    authorizationService.resolveReportResourceContext.mockResolvedValue(context)

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.reportResourceContext).toBe(context)
  })

  it('rejects users without report access', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createUser('1201743399'),
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
