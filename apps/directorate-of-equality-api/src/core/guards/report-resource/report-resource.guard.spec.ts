/* eslint-disable local-rules/disallow-kennitalas */
import { ForbiddenException } from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { ReportStatusEnum } from '../../../modules/report/models/report.model'
import { ReportResourceActorKindEnum } from '../../../modules/report/types/report-resource-context'
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
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const reportModel = {
    findByPkOrThrow: jest.fn(),
  }

  const userModel = {
    findOne: jest.fn(),
  }

  let guard: ReportResourceGuard

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new ReportResourceGuard(
      logger as never,
      reportModel as never,
      userModel as never,
    )
  })

  it('attaches reviewer resource context to the request', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createUser('1201743399'),
    }

    reportModel.findByPkOrThrow.mockResolvedValue({
      id: 'report-1',
      status: ReportStatusEnum.IN_REVIEW,
      contactNationalId: '9999999999',
    })
    userModel.findOne.mockResolvedValue({ id: 'reviewer-1' })

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.reportResourceContext).toEqual({
      reportId: 'report-1',
      reportStatus: ReportStatusEnum.IN_REVIEW,
      actor: {
        kind: ReportResourceActorKindEnum.REVIEWER,
        userId: 'reviewer-1',
      },
    })
  })

  it('attaches contact resource context when the report contact matches', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createUser('5500000000'),
    }

    reportModel.findByPkOrThrow.mockResolvedValue({
      id: 'report-1',
      status: ReportStatusEnum.SUBMITTED,
      contactNationalId: '5500000000',
    })
    userModel.findOne.mockResolvedValue(null)

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.reportResourceContext).toEqual({
      reportId: 'report-1',
      reportStatus: ReportStatusEnum.SUBMITTED,
      actor: {
        kind: ReportResourceActorKindEnum.CONTACT,
        nationalId: '5500000000',
      },
    })
  })

  it('rejects users without report access', async () => {
    const request: Record<string, unknown> = {
      params: { reportId: 'report-1' },
      user: createUser('1201743399'),
    }

    reportModel.findByPkOrThrow.mockResolvedValue({
      id: 'report-1',
      status: ReportStatusEnum.SUBMITTED,
      contactNationalId: '5500000000',
    })
    userModel.findOne.mockResolvedValue(null)

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
