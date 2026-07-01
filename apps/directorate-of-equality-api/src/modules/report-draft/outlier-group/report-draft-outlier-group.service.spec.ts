import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportModel } from '../../report/models/report.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftOutlierGroupService } from './report-draft-outlier-group.service'

const REPORT_ID = 'report-id-1'
const GROUP_ID = 'group-id-1'
const EMPLOYEE_ID = 'emp-1'

// Appliers take an already-resolved draft (no findOwnedDraft).
const report = { id: REPORT_ID } as ReportModel

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDraftOutlierGroupService', () => {
  let service: ReportDraftOutlierGroupService
  let findOwnedDraft: jest.Mock
  let groupFindOne: jest.Mock
  let groupFindByPk: jest.Mock
  let groupBuild: jest.Mock
  let groupSave: jest.Mock
  let outlierFindOne: jest.Mock
  let outlierCreate: jest.Mock
  let outlierCount: jest.Mock
  let employeeFindOne: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    groupFindOne = jest.fn().mockResolvedValue({ id: GROUP_ID })
    groupFindByPk = jest.fn().mockResolvedValue(null)
    groupSave = jest.fn()
    // build() returns a fresh row; the service sets `.id` then saves.
    groupBuild = jest.fn().mockImplementation((attrs) => ({
      ...attrs,
      save: groupSave,
    }))
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
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: groupFindOne,
            findByPk: groupFindByPk,
            build: groupBuild,
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
      await service.createGroup(report, GROUP_ID, { name: 'A' })

      expect(groupBuild).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'A',
          reportId: REPORT_ID,
          reason: null,
          action: null,
          signatureName: null,
          signatureRole: null,
        }),
      )
      expect(groupSave).toHaveBeenCalled()
    })

    it('400s on a partially-filled explanation', async () => {
      await expect(
        service.createGroup(report, GROUP_ID, {
          name: 'A',
          reason: 'because',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('400s when name is missing', async () => {
      await expect(
        service.createGroup(report, GROUP_ID, {}),
      ).rejects.toThrow(BadRequestException)
    })

    it('creates a fully-explained group', async () => {
      await service.createGroup(report, GROUP_ID, {
        name: 'A',
        reason: 'r',
        action: 'a',
        signatureName: 's',
        signatureRole: 'role',
      })

      expect(groupBuild).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'r', signatureRole: 'role' }),
      )
      expect(groupSave).toHaveBeenCalled()
    })
  })

  describe('removeGroup', () => {
    it('409s when the group still has members', async () => {
      const destroy = jest.fn()
      groupFindOne.mockResolvedValueOnce({ id: GROUP_ID, destroy })
      outlierCount.mockResolvedValueOnce(2)

      await expect(service.removeGroup(report, GROUP_ID)).rejects.toThrow(
        ConflictException,
      )
      expect(destroy).not.toHaveBeenCalled()
    })

    it('destroys an empty group', async () => {
      const destroy = jest.fn()
      groupFindOne.mockResolvedValueOnce({ id: GROUP_ID, destroy })
      outlierCount.mockResolvedValueOnce(0)

      await service.removeGroup(report, GROUP_ID)

      expect(destroy).toHaveBeenCalled()
    })
  })

  describe('setEmployeeGroup', () => {
    it('assigns a detected outlier to a group (creates the join row)', async () => {
      outlierFindOne.mockResolvedValueOnce(null)

      await service.setEmployeeGroup(
        report,
        EMPLOYEE_ID,
        GROUP_ID,
        new Set([EMPLOYEE_ID]),
      )

      expect(outlierCreate).toHaveBeenCalledWith({
        reportEmployeeId: EMPLOYEE_ID,
        groupId: GROUP_ID,
      })
    })

    it('re-points an existing membership row', async () => {
      const update = jest.fn()
      outlierFindOne.mockResolvedValueOnce({ id: 'o-1', update })

      await service.setEmployeeGroup(
        report,
        EMPLOYEE_ID,
        GROUP_ID,
        new Set([EMPLOYEE_ID]),
      )

      expect(update).toHaveBeenCalledWith({ groupId: GROUP_ID })
      expect(outlierCreate).not.toHaveBeenCalled()
    })

    it('400s when the employee is not a detected outlier', async () => {
      await expect(
        service.setEmployeeGroup(
          report,
          EMPLOYEE_ID,
          GROUP_ID,
          new Set<string>(),
        ),
      ).rejects.toThrow(BadRequestException)
      expect(outlierCreate).not.toHaveBeenCalled()
    })

    it('404s when the group is not in the draft', async () => {
      groupFindOne.mockResolvedValueOnce(null)

      await expect(
        service.setEmployeeGroup(
          report,
          EMPLOYEE_ID,
          GROUP_ID,
          new Set([EMPLOYEE_ID]),
        ),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
