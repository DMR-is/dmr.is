import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { ReportModel } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftAssignmentService } from './report-draft-assignment.service'
import {
  AssignmentOwnerEnum,
  PreBatchAssignment,
} from './report-draft-assignment.service.interface'

const REPORT_ID = 'report-id-1'
const ROLE_ID = 'role-id-1'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY = ({
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown) as CompanyDto

// Appliers take an already-resolved draft (no findOwnedDraft).
const report = { id: REPORT_ID } as ReportModel

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDraftAssignmentService', () => {
  let service: ReportDraftAssignmentService
  let findOwnedDraft: jest.Mock
  let roleFindOne: jest.Mock
  let employeeFindOne: jest.Mock
  let stepFindAll: jest.Mock
  let subFindAll: jest.Mock
  let criterionCount: jest.Mock
  let roleStepFindAll: jest.Mock
  let roleStepDestroy: jest.Mock
  let roleStepBulkCreate: jest.Mock
  let personalStepFindAll: jest.Mock
  let personalStepBulkCreate: jest.Mock
  let roleModelFindAll: jest.Mock
  let employeeFindAll: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    roleFindOne = jest.fn().mockResolvedValue({ id: ROLE_ID })
    employeeFindOne = jest.fn().mockResolvedValue({ id: 'emp-1' })
    stepFindAll = jest.fn().mockResolvedValue([])
    subFindAll = jest.fn().mockResolvedValue([])
    criterionCount = jest.fn().mockResolvedValue(0)
    roleStepFindAll = jest.fn().mockResolvedValue([])
    roleStepDestroy = jest.fn()
    roleStepBulkCreate = jest.fn()
    personalStepFindAll = jest.fn().mockResolvedValue([])
    personalStepBulkCreate = jest.fn()
    roleModelFindAll = jest.fn().mockResolvedValue([{ id: ROLE_ID }])
    employeeFindAll = jest.fn().mockResolvedValue([{ id: 'emp-1' }])

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftAssignmentService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: { findOne: roleFindOne, findAll: roleModelFindAll },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { findOne: employeeFindOne, findAll: employeeFindAll },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: { findAll: stepFindAll },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: { findAll: subFindAll },
        },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { count: criterionCount },
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: {
            findAll: roleStepFindAll,
            destroy: roleStepDestroy,
            bulkCreate: roleStepBulkCreate,
          },
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: {
            findAll: personalStepFindAll,
            destroy: jest.fn(),
            bulkCreate: personalStepBulkCreate,
          },
        },
      ],
    }).compile()

    service = module.get(ReportDraftAssignmentService)
  })

  it('replaces a role’s step assignments after validating ownership', async () => {
    // Two requested steps → one sub-criterion → one criterion in the report.
    stepFindAll.mockResolvedValueOnce([
      { id: 'step-1', reportSubCriterionId: 'sub-1' },
      { id: 'step-2', reportSubCriterionId: 'sub-1' },
    ])
    subFindAll.mockResolvedValueOnce([
      { id: 'sub-1', reportCriterionId: 'crit-1' },
    ])
    criterionCount.mockResolvedValueOnce(1)

    await service.setRoleSteps(report, ROLE_ID, ['step-1', 'step-2', 'step-1'])

    expect(roleStepDestroy).toHaveBeenCalledWith({
      where: { reportEmployeeRoleId: ROLE_ID },
    })
    // Deduped to 2 unique steps.
    expect(roleStepBulkCreate).toHaveBeenCalledWith([
      { reportEmployeeRoleId: ROLE_ID, reportSubCriterionStepId: 'step-1' },
      { reportEmployeeRoleId: ROLE_ID, reportSubCriterionStepId: 'step-2' },
    ])
  })

  it('clears assignments when given an empty set (no bulkCreate)', async () => {
    await service.setRoleSteps(report, ROLE_ID, [])

    expect(roleStepDestroy).toHaveBeenCalled()
    expect(roleStepBulkCreate).not.toHaveBeenCalled()
  })

  it('400s when a step does not exist', async () => {
    stepFindAll.mockResolvedValueOnce([
      { id: 'step-1', reportSubCriterionId: 'sub-1' },
    ])

    await expect(
      service.setRoleSteps(report, ROLE_ID, ['step-1', 'missing']),
    ).rejects.toThrow(BadRequestException)
    expect(roleStepDestroy).not.toHaveBeenCalled()
  })

  it('400s when a step belongs to another report', async () => {
    stepFindAll.mockResolvedValueOnce([
      { id: 'step-1', reportSubCriterionId: 'sub-1' },
    ])
    subFindAll.mockResolvedValueOnce([
      { id: 'sub-1', reportCriterionId: 'crit-foreign' },
    ])
    criterionCount.mockResolvedValueOnce(0) // criterion not in this report

    await expect(
      service.setRoleSteps(report, ROLE_ID, ['step-1']),
    ).rejects.toThrow(BadRequestException)
    expect(roleStepDestroy).not.toHaveBeenCalled()
  })

  it('404s when the role is not in the draft', async () => {
    roleFindOne.mockResolvedValueOnce(null)

    await expect(
      service.getRoleSteps(PROVIDER_ID, COMPANY, ROLE_ID),
    ).rejects.toThrow(NotFoundException)
  })

  describe('snapshotAssignmentsForSteps', () => {
    it('captures each assignment with the step’s pre-batch order', async () => {
      stepFindAll.mockResolvedValueOnce([
        { id: 'step-5', reportSubCriterionId: 'sub-1', order: 5 },
      ])
      roleStepFindAll.mockResolvedValueOnce([
        { reportEmployeeRoleId: ROLE_ID, reportSubCriterionStepId: 'step-5' },
      ])
      personalStepFindAll.mockResolvedValueOnce([
        { reportEmployeeId: 'emp-1', reportSubCriterionStepId: 'step-5' },
      ])

      const snapshots = await service.snapshotAssignmentsForSteps(report, [
        'step-5',
        'step-5',
      ])

      expect(snapshots).toEqual([
        {
          owner: AssignmentOwnerEnum.ROLE,
          ownerId: ROLE_ID,
          subCriterionId: 'sub-1',
          order: 5,
        },
        {
          owner: AssignmentOwnerEnum.EMPLOYEE,
          ownerId: 'emp-1',
          subCriterionId: 'sub-1',
          order: 5,
        },
      ])
      // Deduped before the lookup.
      expect(stepFindAll).toHaveBeenCalledWith({
        where: { id: ['step-5'] },
        attributes: ['id', 'reportSubCriterionId', 'order'],
      })
    })

    it('returns nothing (and does not query the joins) for an empty id list', async () => {
      expect(await service.snapshotAssignmentsForSteps(report, [])).toEqual([])
      expect(stepFindAll).not.toHaveBeenCalled()
      expect(roleStepFindAll).not.toHaveBeenCalled()
    })

    it('ignores step ids that no longer resolve — removeStep rejects those', async () => {
      stepFindAll.mockResolvedValueOnce([])

      expect(
        await service.snapshotAssignmentsForSteps(report, ['gone']),
      ).toEqual([])
      expect(roleStepFindAll).not.toHaveBeenCalled()
    })
  })

  describe('clampOrphanedAssignments', () => {
    const roleOnOrder = (order: number): PreBatchAssignment => ({
      owner: AssignmentOwnerEnum.ROLE,
      ownerId: ROLE_ID,
      subCriterionId: 'sub-1',
      order,
    })

    /** Surviving steps of sub-1, as the post-batch step query would return. */
    const surviving = (...orders: number[]) =>
      orders.map((order) => ({
        id: `step-${order}`,
        reportSubCriterionId: 'sub-1',
        order,
      }))

    beforeEach(() => {
      subFindAll.mockResolvedValue([{ id: 'sub-1' }])
    })

    it('moves a top-step role down to the new top step (5 þrep → 4)', async () => {
      stepFindAll.mockResolvedValueOnce(surviving(1, 2, 3, 4))

      await service.clampOrphanedAssignments(report, [roleOnOrder(5)])

      // Greatest order ≤ 5 → order 4, which now carries the full 40 points.
      expect(roleStepBulkCreate).toHaveBeenCalledWith([
        { reportEmployeeRoleId: ROLE_ID, reportSubCriterionStepId: 'step-4' },
      ])
      expect(personalStepBulkCreate).not.toHaveBeenCalled()
    })

    it('falls to the nearest higher step when nothing survives below', async () => {
      stepFindAll.mockResolvedValueOnce(surviving(3, 4, 5))

      await service.clampOrphanedAssignments(report, [roleOnOrder(1)])

      expect(roleStepBulkCreate).toHaveBeenCalledWith([
        { reportEmployeeRoleId: ROLE_ID, reportSubCriterionStepId: 'step-3' },
      ])
    })

    it('leaves the assignment off when the sub-criterion has no steps left', async () => {
      stepFindAll.mockResolvedValueOnce([])

      await service.clampOrphanedAssignments(report, [roleOnOrder(5)])

      expect(roleStepBulkCreate).not.toHaveBeenCalled()
    })

    it('leaves the assignment off when the sub-criterion itself is gone', async () => {
      subFindAll.mockResolvedValue([])

      await service.clampOrphanedAssignments(report, [roleOnOrder(5)])

      expect(stepFindAll).not.toHaveBeenCalled()
      expect(roleStepBulkCreate).not.toHaveBeenCalled()
    })

    it('does not move an assignment the sub-criterion already carries', async () => {
      stepFindAll.mockResolvedValueOnce(surviving(1, 2, 3, 4))
      // Post-batch the role already stands on a step of sub-1 — a re-sent batch,
      // or an explicit stepIds that named a survivor. Re-running must be a no-op.
      roleStepFindAll.mockResolvedValueOnce([
        { reportEmployeeRoleId: ROLE_ID, reportSubCriterionStepId: 'step-4' },
      ])

      await service.clampOrphanedAssignments(report, [roleOnOrder(5)])

      expect(roleStepBulkCreate).not.toHaveBeenCalled()
    })

    it('collapses several removed steps of one sub-criterion to the highest order', async () => {
      // A wholesale template swap: orders 1–5 all removed, 1–4 created fresh.
      stepFindAll.mockResolvedValueOnce(surviving(1, 2, 3, 4))

      await service.clampOrphanedAssignments(report, [
        roleOnOrder(2),
        roleOnOrder(5),
        roleOnOrder(3),
      ])

      // One row, resolved from order 5 — not three, and not order 2's answer.
      expect(roleStepBulkCreate).toHaveBeenCalledWith([
        { reportEmployeeRoleId: ROLE_ID, reportSubCriterionStepId: 'step-4' },
      ])
    })

    it('clamps a personal assignment through the employee join', async () => {
      stepFindAll.mockResolvedValueOnce(surviving(1, 2, 3, 4))

      await service.clampOrphanedAssignments(report, [
        {
          owner: AssignmentOwnerEnum.EMPLOYEE,
          ownerId: 'emp-1',
          subCriterionId: 'sub-1',
          order: 5,
        },
      ])

      expect(personalStepBulkCreate).toHaveBeenCalledWith([
        { reportEmployeeId: 'emp-1', reportSubCriterionStepId: 'step-4' },
      ])
      expect(roleStepBulkCreate).not.toHaveBeenCalled()
    })

    it('skips an owner the same batch removed (its FK is gone)', async () => {
      stepFindAll.mockResolvedValueOnce(surviving(1, 2, 3, 4))
      roleModelFindAll.mockResolvedValueOnce([])

      await service.clampOrphanedAssignments(report, [roleOnOrder(5)])

      expect(roleStepBulkCreate).not.toHaveBeenCalled()
    })

    it('is a no-op with nothing snapshotted', async () => {
      await service.clampOrphanedAssignments(report, [])

      expect(subFindAll).not.toHaveBeenCalled()
      expect(roleStepBulkCreate).not.toHaveBeenCalled()
    })
  })
})
