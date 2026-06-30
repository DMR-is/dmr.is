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
import { GenderEnum } from '../../report/models/report.enums'
import {
  EducationEnum,
  ReportEmployeeModel,
} from '../../report-employee/models/report-employee.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { CreateDraftEmployeeDto } from './dto/create-draft-employee.dto'
import { ReportDraftEmployeeService } from './report-draft-employee.service'

const REPORT_ID = 'report-id-1'
const ROLE_ID = 'role-id-1'
const EMPLOYEE_ID = 'employee-id-1'
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

const createInput = (overrides: Partial<CreateDraftEmployeeDto> = {}) =>
  ({
    reportEmployeeRoleId: ROLE_ID,
    education: EducationEnum.BACHELOR,
    gender: GenderEnum.FEMALE,
    field: 'Engineering',
    department: 'R&D',
    startDate: '2020-01-01',
    workRatio: 1,
    baseSalary: 800000,
    ...overrides,
  }) as CreateDraftEmployeeDto

describe('ReportDraftEmployeeService', () => {
  let service: ReportDraftEmployeeService
  let findOwnedDraft: jest.Mock
  let employeeFindAndCountAll: jest.Mock
  let employeeFindOne: jest.Mock
  let employeeCreate: jest.Mock
  let employeeMax: jest.Mock
  let roleFindOne: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    employeeFindAndCountAll = jest
      .fn()
      .mockResolvedValue({ rows: [], count: 0 })
    employeeFindOne = jest.fn().mockResolvedValue(null)
    employeeCreate = jest.fn(async (values) => ({
      id: EMPLOYEE_ID,
      additionalSalary: 0,
      bonusSalary: 0,
      ...values,
    }))
    employeeMax = jest.fn().mockResolvedValue(null)
    roleFindOne = jest.fn().mockResolvedValue({ id: ROLE_ID })

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftEmployeeService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: {
            findAndCountAll: employeeFindAndCountAll,
            findOne: employeeFindOne,
            create: employeeCreate,
            max: employeeMax,
          },
        },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: { findOne: roleFindOne },
        },
      ],
    }).compile()

    service = module.get(ReportDraftEmployeeService)
  })

  it('creates an employee with the next ordinal and a NULL score', async () => {
    employeeMax.mockResolvedValueOnce(4)

    const result = await service.createEmployee(
      PROVIDER_ID,
      COMPANY,
      createInput(),
    )

    expect(roleFindOne).toHaveBeenCalledWith({
      where: { id: ROLE_ID, reportId: REPORT_ID },
    })
    expect(employeeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        ordinal: 5,
        score: null,
        reportEmployeeRoleId: ROLE_ID,
      }),
    )
    expect(result.id).toBe(EMPLOYEE_ID)
  })

  it('assigns ordinal 1 to the first employee', async () => {
    employeeMax.mockResolvedValueOnce(null)

    await service.createEmployee(PROVIDER_ID, COMPANY, createInput())

    expect(employeeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ ordinal: 1 }),
    )
  })

  it('rejects a role that does not belong to the report (400)', async () => {
    roleFindOne.mockResolvedValueOnce(null)

    await expect(
      service.createEmployee(PROVIDER_ID, COMPANY, createInput()),
    ).rejects.toThrow(BadRequestException)
    expect(employeeCreate).not.toHaveBeenCalled()
  })

  it('patches only the provided employee fields', async () => {
    const row = {
      id: EMPLOYEE_ID,
      reportId: REPORT_ID,
      additionalSalary: 0,
      bonusSalary: 0,
      update: jest.fn(async function (this: Record<string, unknown>, vals) {
        Object.assign(row, vals)
      }),
    }
    employeeFindOne.mockResolvedValueOnce(row)

    await service.updateEmployee(PROVIDER_ID, COMPANY, EMPLOYEE_ID, {
      baseSalary: 900000,
    })

    expect(row.update).toHaveBeenCalledWith({ baseSalary: 900000 })
  })

  it('validates a re-assigned role on update', async () => {
    employeeFindOne.mockResolvedValueOnce({ id: EMPLOYEE_ID })
    roleFindOne.mockResolvedValueOnce(null)

    await expect(
      service.updateEmployee(PROVIDER_ID, COMPANY, EMPLOYEE_ID, {
        reportEmployeeRoleId: 'other-role',
      }),
    ).rejects.toThrow(BadRequestException)
  })

  it('404s updating an employee not in the draft', async () => {
    employeeFindOne.mockResolvedValueOnce(null)

    await expect(
      service.updateEmployee(PROVIDER_ID, COMPANY, EMPLOYEE_ID, {
        field: 'x',
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('deletes an employee it owns', async () => {
    const destroy = jest.fn()
    employeeFindOne.mockResolvedValueOnce({ id: EMPLOYEE_ID, destroy })

    await service.deleteEmployee(PROVIDER_ID, COMPANY, EMPLOYEE_ID)

    expect(destroy).toHaveBeenCalled()
  })
})
