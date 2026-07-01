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

const REPORT_ID = 'report-id-1'
const ROLE_ID = 'role-id-1'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY = {
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

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

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftAssignmentService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: { findOne: roleFindOne },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { findOne: employeeFindOne },
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
          useValue: { findAll: jest.fn(), destroy: jest.fn(), bulkCreate: jest.fn() },
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
})
