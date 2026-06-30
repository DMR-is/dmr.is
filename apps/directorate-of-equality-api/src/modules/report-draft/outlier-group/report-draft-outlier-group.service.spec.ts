import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { IReportDraftAnalysisService } from '../analysis/report-draft-analysis.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftOutlierGroupService } from './report-draft-outlier-group.service'

const REPORT_ID = 'report-id-1'
const GROUP_ID = 'group-id-1'
const EMPLOYEE_ID = 'emp-1'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY = {
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDraftOutlierGroupService', () => {
  let service: ReportDraftOutlierGroupService
  let findOwnedDraft: jest.Mock
  let getDetectedOutlierEmployeeIds: jest.Mock
  let groupFindOne: jest.Mock
  let groupCreate: jest.Mock
  let outlierFindOne: jest.Mock
  let outlierCreate: jest.Mock
  let outlierCount: jest.Mock
  let employeeFindOne: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    getDetectedOutlierEmployeeIds = jest
      .fn()
      .mockResolvedValue(new Set<string>())
    groupFindOne = jest.fn().mockResolvedValue({ id: GROUP_ID })
    groupCreate = jest.fn()
    outlierFindOne = jest.fn().mockResolvedValue(null)
    outlierCreate = jest.fn()
    outlierCount = jest.fn().mockResolvedValue(0)
    employeeFindOne = jest.fn().mockResolvedValue({ id: EMPLOYEE_ID })

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftOutlierGroupService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: IReportDraftAnalysisService,
          useValue: { getDetectedOutlierEmployeeIds },
        },
        {
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: groupFindOne,
            create: groupCreate,
          },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: {
            findOne: outlierFindOne,
            create: outlierCreate,
            count: outlierCount,
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { findOne: employeeFindOne },
        },
      ],
    }).compile()

    service = module.get(ReportDraftOutlierGroupService)
  })

  describe('createGroup', () => {
    it('creates a name-only group (explanation all-null)', async () => {
      groupCreate.mockResolvedValueOnce({ id: GROUP_ID, reportId: REPORT_ID })

      await service.createGroup(PROVIDER_ID, COMPANY, { name: 'A' })

      expect(groupCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'A',
          reportId: REPORT_ID,
          reason: null,
          action: null,
          signatureName: null,
          signatureRole: null,
        }),
      )
    })

    it('400s on a partially-filled explanation', async () => {
      await expect(
        service.createGroup(PROVIDER_ID, COMPANY, {
          name: 'A',
          reason: 'because',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('creates a fully-explained group', async () => {
      groupCreate.mockResolvedValueOnce({ id: GROUP_ID })

      await service.createGroup(PROVIDER_ID, COMPANY, {
        name: 'A',
        reason: 'r',
        action: 'a',
        signatureName: 's',
        signatureRole: 'role',
      })

      expect(groupCreate).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'r', signatureRole: 'role' }),
      )
    })
  })

  describe('deleteGroup', () => {
    it('409s when the group still has members', async () => {
      const destroy = jest.fn()
      groupFindOne.mockResolvedValueOnce({ id: GROUP_ID, destroy })
      outlierCount.mockResolvedValueOnce(2)

      await expect(
        service.deleteGroup(PROVIDER_ID, COMPANY, GROUP_ID),
      ).rejects.toThrow(ConflictException)
      expect(destroy).not.toHaveBeenCalled()
    })
  })

  describe('setEmployeeGroup', () => {
    it('assigns a detected outlier to a group (creates the join row)', async () => {
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(
        new Set([EMPLOYEE_ID]),
      )
      outlierFindOne.mockResolvedValueOnce(null)

      const result = await service.setEmployeeGroup(
        PROVIDER_ID,
        COMPANY,
        EMPLOYEE_ID,
        { groupId: GROUP_ID },
      )

      expect(outlierCreate).toHaveBeenCalledWith({
        reportEmployeeId: EMPLOYEE_ID,
        groupId: GROUP_ID,
      })
      expect(result.groupId).toBe(GROUP_ID)
    })

    it('re-points an existing membership row', async () => {
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(
        new Set([EMPLOYEE_ID]),
      )
      const update = jest.fn()
      outlierFindOne.mockResolvedValueOnce({ id: 'o-1', update })

      await service.setEmployeeGroup(PROVIDER_ID, COMPANY, EMPLOYEE_ID, {
        groupId: GROUP_ID,
      })

      expect(update).toHaveBeenCalledWith({ groupId: GROUP_ID })
      expect(outlierCreate).not.toHaveBeenCalled()
    })

    it('400s when the employee is not a detected outlier', async () => {
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set<string>())

      await expect(
        service.setEmployeeGroup(PROVIDER_ID, COMPANY, EMPLOYEE_ID, {
          groupId: GROUP_ID,
        }),
      ).rejects.toThrow(BadRequestException)
      expect(outlierCreate).not.toHaveBeenCalled()
    })

    it('404s when the group is not in the draft', async () => {
      groupFindOne.mockResolvedValueOnce(null)

      await expect(
        service.setEmployeeGroup(PROVIDER_ID, COMPANY, EMPLOYEE_ID, {
          groupId: GROUP_ID,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
