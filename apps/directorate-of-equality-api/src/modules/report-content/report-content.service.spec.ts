import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { GenderEnum } from '../report/models/report.model'
import { ReportCriterionTypeEnum } from '../report-criterion/models/report-criterion.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { EducationEnum } from '../report-employee/models/report-employee.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'
import { ReportContentService } from './report-content.service'

const REPORT_ID = 'report-id-1'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportContentService', () => {
  let service: ReportContentService
  let roleBulkCreate: jest.Mock
  let criterionCreate: jest.Mock
  let subCriterionCreate: jest.Mock
  let subCriterionStepBulkCreate: jest.Mock
  let roleStepBulkCreate: jest.Mock
  let employeeBulkCreate: jest.Mock
  let personalStepBulkCreate: jest.Mock

  beforeEach(async () => {
    roleBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `role-${i}` })),
    )
    criterionCreate = jest.fn(async (input) => ({
      ...input,
      id: `cri-${Date.now()}-${Math.random()}`,
    }))
    subCriterionCreate = jest.fn(async (input) => ({
      ...input,
      id: `sub-${Date.now()}-${Math.random()}`,
    }))
    subCriterionStepBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({
        ...r,
        id: `step-${Date.now()}-${i}`,
      })),
    )
    roleStepBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `rs-${i}` })),
    )
    employeeBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `emp-${i}` })),
    )
    personalStepBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `ps-${i}` })),
    )

    const module = await Test.createTestingModule({
      providers: [
        ReportContentService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: { bulkCreate: roleBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { bulkCreate: employeeBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: { bulkCreate: roleStepBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: { bulkCreate: personalStepBulkCreate },
        },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { create: criterionCreate },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: { create: subCriterionCreate },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: { bulkCreate: subCriterionStepBulkCreate },
        },
      ],
    }).compile()

    service = module.get(ReportContentService)
  })

  it('creates roles, criteria, sub-criteria, steps, employees and join rows and returns the ordinal→id map', async () => {
    const { employeeOrdinalToId } = await service.persistParsedChildren(
      REPORT_ID,
      makeParsed(),
      [60],
    )

    // 1 role, 1 criterion, 1 sub_criterion, 2 steps, 1 employee.
    expect(roleBulkCreate.mock.calls[0][0]).toHaveLength(1)
    expect(roleBulkCreate.mock.calls[0][0][0]).toMatchObject({
      title: 'Framkvaemdastjori',
      reportId: REPORT_ID,
    })
    expect(criterionCreate).toHaveBeenCalledTimes(1)
    expect(subCriterionCreate).toHaveBeenCalledTimes(1)
    expect(subCriterionStepBulkCreate.mock.calls[0][0]).toHaveLength(2)

    // role step assignment + personal step assignment both resolve.
    expect(roleStepBulkCreate.mock.calls[0][0]).toEqual([
      expect.objectContaining({ reportEmployeeRoleId: 'role-0' }),
    ])
    expect(personalStepBulkCreate.mock.calls[0][0]).toEqual([
      expect.objectContaining({ reportEmployeeId: 'emp-0' }),
    ])

    // employee row carries the passed-in score and report id.
    expect(employeeBulkCreate.mock.calls[0][0][0]).toMatchObject({
      reportId: REPORT_ID,
      reportEmployeeRoleId: 'role-0',
      score: 60,
    })

    // ordinal 1 → the created employee id.
    expect(employeeOrdinalToId.get(1)).toBe('emp-0')
    expect(employeeOrdinalToId.size).toBe(1)
  })

  it('writes a null score when the score array holds null', async () => {
    await service.persistParsedChildren(REPORT_ID, makeParsed(), [null])

    expect(employeeBulkCreate.mock.calls[0][0][0].score).toBeNull()
  })
})

function makeParsed(): ParsedReportDto {
  return {
    criteria: [
      {
        type: ReportCriterionTypeEnum.RESPONSIBILITY,
        title: 'Abyrgd',
        description: 'Responsibility',
        weight: 15,
        subCriteria: [
          {
            title: 'Abyrgd a fólki',
            description: 'People responsibility',
            weight: 5,
            steps: [
              { order: 1, description: 'low', score: 10 },
              { order: 5, description: 'high', score: 50 },
            ],
          },
        ],
      },
    ],
    roles: [
      {
        title: 'Framkvaemdastjori',
        stepAssignments: [
          {
            criterionTitle: 'Abyrgd',
            subTitle: 'Abyrgd a fólki',
            stepOrder: 5,
          },
        ],
      },
    ],
    employees: [
      {
        ordinal: 1,
        identifier: 'TVE-001',
        roleTitle: 'Framkvaemdastjori',
        education: EducationEnum.MASTER,
        gender: GenderEnum.FEMALE,
        field: 'Mgmt',
        department: 'Mgmt',
        startDate: '2021-01-01',
        workRatio: 1,
        baseSalary: 1000000,
        additionalFixedOvertime: 100000,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        personalStepAssignments: [
          {
            criterionTitle: 'Abyrgd',
            subTitle: 'Abyrgd a fólki',
            stepOrder: 1,
          },
        ],
      },
    ],
  }
}
