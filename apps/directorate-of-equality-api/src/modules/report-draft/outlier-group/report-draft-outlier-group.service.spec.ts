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
  let groupFindAll: jest.Mock
  let outlierFindOne: jest.Mock
  let outlierFindAll: jest.Mock
  let outlierCreate: jest.Mock
  let outlierCount: jest.Mock
  let outlierDestroy: jest.Mock
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
    groupFindAll = jest.fn().mockResolvedValue([])
    outlierFindOne = jest.fn().mockResolvedValue(null)
    outlierFindAll = jest.fn().mockResolvedValue([])
    outlierCreate = jest.fn()
    outlierCount = jest.fn().mockResolvedValue(0)
    outlierDestroy = jest.fn()
    employeeFindOne = jest.fn().mockResolvedValue({ id: EMPLOYEE_ID })

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftOutlierGroupService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: {
            findAll: groupFindAll,
            findOne: groupFindOne,
            findByPk: groupFindByPk,
            build: groupBuild,
          },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: {
            findOne: outlierFindOne,
            findAll: outlierFindAll,
            create: outlierCreate,
            count: outlierCount,
            destroy: outlierDestroy,
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

      await expect(
        service.setEmployeeGroup(
          report,
          EMPLOYEE_ID,
          GROUP_ID,
          new Set([EMPLOYEE_ID]),
        ),
      ).resolves.toBe(true)

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

    // Reported, not thrown: the caller is mid-batch and a 400 would roll back
    // the edits that made this employee a non-outlier in the first place.
    it('reports false and writes nothing for a non-detected employee', async () => {
      await expect(
        service.setEmployeeGroup(
          report,
          EMPLOYEE_ID,
          GROUP_ID,
          new Set<string>(),
        ),
      ).resolves.toBe(false)
      expect(outlierCreate).not.toHaveBeenCalled()
      expect(outlierDestroy).not.toHaveBeenCalled()
    })

    it('404s an unknown employee even when it is not a detected outlier', async () => {
      employeeFindOne.mockResolvedValueOnce(null)

      await expect(
        service.setEmployeeGroup(
          report,
          'ghost',
          GROUP_ID,
          new Set<string>(),
        ),
      ).rejects.toThrow(NotFoundException)
    })

    it('404s an unknown group even when the employee is not detected', async () => {
      groupFindOne.mockResolvedValueOnce(null)

      await expect(
        service.setEmployeeGroup(
          report,
          EMPLOYEE_ID,
          'ghost-group',
          new Set<string>(),
        ),
      ).rejects.toThrow(NotFoundException)
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

  describe('getMemberEmployeeIds', () => {
    it('lists the employees sitting in one of the draft\'s groups', async () => {
      groupFindAll.mockResolvedValueOnce([{ id: GROUP_ID }, { id: 'group-2' }])
      outlierFindAll.mockResolvedValueOnce([
        { reportEmployeeId: EMPLOYEE_ID },
        { reportEmployeeId: 'emp-2' },
      ])

      await expect(service.getMemberEmployeeIds(report)).resolves.toEqual([
        EMPLOYEE_ID,
        'emp-2',
      ])
      expect(outlierFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { groupId: [GROUP_ID, 'group-2'] } }),
      )
    })

    it('skips the membership query when the draft has no groups', async () => {
      groupFindAll.mockResolvedValueOnce([])

      await expect(service.getMemberEmployeeIds(report)).resolves.toEqual([])
      expect(outlierFindAll).not.toHaveBeenCalled()
    })
  })

  describe('clearEmployeeGroups', () => {
    it('deletes the membership rows scoped to the draft\'s own groups', async () => {
      groupFindAll.mockResolvedValueOnce([{ id: GROUP_ID }])

      await service.clearEmployeeGroups(report, [EMPLOYEE_ID, 'emp-2'])

      // The scoping this method's safety rests on: the group ids it ANDs
      // against are looked up by this report, not taken from the caller.
      expect(groupFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { reportId: REPORT_ID } }),
      )
      expect(outlierDestroy).toHaveBeenCalledWith({
        where: {
          reportEmployeeId: [EMPLOYEE_ID, 'emp-2'],
          groupId: [GROUP_ID],
        },
      })
    })

    it('is a no-op for an empty id list', async () => {
      await service.clearEmployeeGroups(report, [])

      expect(groupFindAll).not.toHaveBeenCalled()
      expect(outlierDestroy).not.toHaveBeenCalled()
    })

    it('is a no-op when the draft has no groups to scope against', async () => {
      groupFindAll.mockResolvedValueOnce([])

      await service.clearEmployeeGroups(report, [EMPLOYEE_ID])

      expect(outlierDestroy).not.toHaveBeenCalled()
    })
  })

  describe('clearEmployeeGroup', () => {
    it('404s an employee that is not in the draft', async () => {
      employeeFindOne.mockResolvedValueOnce(null)

      await expect(service.clearEmployeeGroup(report, 'ghost')).rejects.toThrow(
        NotFoundException,
      )
      expect(outlierDestroy).not.toHaveBeenCalled()
    })

    it('deletes through the same scoped bulk path as the plural', async () => {
      groupFindAll.mockResolvedValueOnce([{ id: GROUP_ID }])

      await service.clearEmployeeGroup(report, EMPLOYEE_ID)

      expect(outlierDestroy).toHaveBeenCalledWith({
        where: { reportEmployeeId: [EMPLOYEE_ID], groupId: [GROUP_ID] },
      })
    })
  })
})
