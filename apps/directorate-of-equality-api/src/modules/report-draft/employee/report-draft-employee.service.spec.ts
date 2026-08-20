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
import { ReportModel } from '../../report/models/report.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { EmployeeChangeDataDto } from '../sync/dto/change-employee.dto'
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

const report = { id: REPORT_ID } as ReportModel

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const changeData = (
  overrides: Partial<EmployeeChangeDataDto> = {},
): EmployeeChangeDataDto => ({
  reportEmployeeRoleId: ROLE_ID,
  gender: GenderEnum.FEMALE,
  field: 'Engineering',
  department: 'R&D',
  startDate: '2020-01-01',
  paidHours: 1,
  baseSalary: 800000,
  ...overrides,
})

describe('ReportDraftEmployeeService', () => {
  let service: ReportDraftEmployeeService
  let findOwnedDraft: jest.Mock
  let employeeFindAndCountAll: jest.Mock
  let employeeFindOne: jest.Mock
  let employeeFindByPk: jest.Mock
  let employeeBuild: jest.Mock
  let employeeMax: jest.Mock
  let roleFindOne: jest.Mock
  let roleFindAll: jest.Mock
  let personalStepDestroy: jest.Mock
  let personalStepFindAll: jest.Mock
  let outlierDestroy: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    employeeFindAndCountAll = jest
      .fn()
      .mockResolvedValue({ rows: [], count: 0 })
    employeeFindOne = jest.fn().mockResolvedValue(null)
    employeeFindByPk = jest.fn().mockResolvedValue(null)
    employeeBuild = jest.fn()
    employeeMax = jest.fn().mockResolvedValue(null)
    roleFindOne = jest.fn().mockResolvedValue({ id: ROLE_ID })
    roleFindAll = jest
      .fn()
      .mockResolvedValue([{ id: ROLE_ID, title: 'Sérfræðingur' }])
    personalStepDestroy = jest.fn().mockResolvedValue(0)
    personalStepFindAll = jest.fn().mockResolvedValue([])
    outlierDestroy = jest.fn().mockResolvedValue(0)

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
            findByPk: employeeFindByPk,
            build: employeeBuild,
            max: employeeMax,
          },
        },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: { findOne: roleFindOne, findAll: roleFindAll },
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: {
            destroy: personalStepDestroy,
            findAll: personalStepFindAll,
          },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: { destroy: outlierDestroy },
        },
      ],
    }).compile()

    service = module.get(ReportDraftEmployeeService)
  })

  describe('listEmployeesWithSteps', () => {
    const employeeRow = (id: string, ordinal: number) => ({
      id,
      ordinal,
      reportId: REPORT_ID,
      reportEmployeeRoleId: ROLE_ID,
      gender: GenderEnum.FEMALE,
      startDate: '2020-01-01',
      paidHours: 1,
      baseSalary: 800000,
      score: null,
    })

    it('inlines each employee\'s personal step ids in one step query', async () => {
      employeeFindAndCountAll.mockResolvedValueOnce({
        rows: [employeeRow(EMPLOYEE_ID, 1), employeeRow('employee-id-2', 2)],
        count: 2,
      })
      personalStepFindAll.mockResolvedValueOnce([
        { reportEmployeeId: EMPLOYEE_ID, reportSubCriterionStepId: 'step-1' },
        { reportEmployeeId: 'employee-id-2', reportSubCriterionStepId: 'step-2' },
        { reportEmployeeId: EMPLOYEE_ID, reportSubCriterionStepId: 'step-3' },
      ])

      const result = await service.listEmployeesWithSteps(
        PROVIDER_ID,
        COMPANY,
        { page: 1, pageSize: 10 },
      )

      expect(findOwnedDraft).toHaveBeenCalledWith(PROVIDER_ID, COMPANY)
      expect(
        result.employees.map((e) => ({ id: e.id, stepIds: e.stepIds })),
      ).toEqual([
        { id: EMPLOYEE_ID, stepIds: ['step-1', 'step-3'] },
        { id: 'employee-id-2', stepIds: ['step-2'] },
      ])
      // Full employee payload is preserved alongside the join.
      expect(result.employees[0]).toEqual(
        expect.objectContaining({
          ordinal: 1,
          baseSalary: 800000,
          score: null,
          roleTitle: 'Sérfræðingur',
        }),
      )
      expect(result.paging).toEqual(
        expect.objectContaining({ totalItems: 2 }),
      )
    })

    // The join must not widen the page: a request for page 2 looks up steps for
    // page 2's ids only, never the whole report.
    it('scopes the step lookup to the ids on the requested page', async () => {
      employeeFindAndCountAll.mockResolvedValueOnce({
        rows: [employeeRow('employee-id-3', 3)],
        count: 30,
      })

      await service.listEmployeesWithSteps(PROVIDER_ID, COMPANY, {
        page: 3,
        pageSize: 1,
      })

      expect(personalStepFindAll).toHaveBeenCalledTimes(1)
      expect(personalStepFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reportEmployeeId: ['employee-id-3'] },
        }),
      )
    })

    it('labels each employee with its own role title', async () => {
      employeeFindAndCountAll.mockResolvedValueOnce({
        rows: [
          employeeRow(EMPLOYEE_ID, 1),
          { ...employeeRow('employee-id-2', 2), reportEmployeeRoleId: 'role-id-2' },
        ],
        count: 2,
      })
      roleFindAll.mockResolvedValueOnce([
        { id: ROLE_ID, title: 'Sérfræðingur' },
        { id: 'role-id-2', title: 'Stjórnandi' },
      ])

      const result = await service.listEmployeesWithSteps(
        PROVIDER_ID,
        COMPANY,
        { page: 1, pageSize: 10 },
      )

      expect(
        result.employees.map((e) => ({ id: e.id, roleTitle: e.roleTitle })),
      ).toEqual([
        { id: EMPLOYEE_ID, roleTitle: 'Sérfræðingur' },
        { id: 'employee-id-2', roleTitle: 'Stjórnandi' },
      ])
      // Roles are capped at 100 per report, so they are fetched whole rather
      // than joined onto the paginated employee query.
      expect(roleFindAll).toHaveBeenCalledTimes(1)
      expect(roleFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { reportId: REPORT_ID } }),
      )
    })

    // The application system renders employees grouped by role, so the page has
    // to arrive sorted by role title with the employee's own index breaking
    // ties — and sorted by the query, or paging would slice an unordered set.
    it('orders by role title, then by ordinal', async () => {
      await service.listEmployeesWithSteps(PROVIDER_ID, COMPANY, {
        page: 1,
        pageSize: 10,
      })

      expect(employeeFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [expect.objectContaining({ as: 'role', attributes: [] })],
          order: [
            [expect.objectContaining({ as: 'role' }), 'title', 'ASC'],
            ['ordinal', 'ASC'],
          ],
        }),
      )
    })

    it('gives a role-scored employee an empty stepIds array', async () => {
      employeeFindAndCountAll.mockResolvedValueOnce({
        rows: [employeeRow(EMPLOYEE_ID, 1)],
        count: 1,
      })
      personalStepFindAll.mockResolvedValueOnce([])

      const result = await service.listEmployeesWithSteps(
        PROVIDER_ID,
        COMPANY,
        { page: 1, pageSize: 10 },
      )

      expect(result.employees[0].stepIds).toEqual([])
    })

    it('skips the step query entirely on an empty page', async () => {
      employeeFindAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 })

      const result = await service.listEmployeesWithSteps(
        PROVIDER_ID,
        COMPANY,
        { page: 1, pageSize: 10 },
      )

      expect(result.employees).toEqual([])
      expect(personalStepFindAll).not.toHaveBeenCalled()
    })
  })

  describe('listEmployees', () => {
    it('orders by role title, then by ordinal', async () => {
      await service.listEmployees(PROVIDER_ID, COMPANY, {
        page: 1,
        pageSize: 10,
      })

      expect(employeeFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reportId: REPORT_ID },
          include: [expect.objectContaining({ as: 'role', attributes: [] })],
          order: [
            [expect.objectContaining({ as: 'role' }), 'title', 'ASC'],
            ['ordinal', 'ASC'],
          ],
        }),
      )
    })
  })

  describe('getMaxOrdinal', () => {
    it('returns the highest ordinal in the report', async () => {
      employeeMax.mockResolvedValueOnce(4)

      const result = await service.getMaxOrdinal(report)

      expect(employeeMax).toHaveBeenCalledWith('ordinal', {
        where: { reportId: REPORT_ID },
      })
      expect(result).toBe(4)
    })

    it('returns 0 when the report has no employees', async () => {
      employeeMax.mockResolvedValueOnce(null)

      const result = await service.getMaxOrdinal(report)

      expect(result).toBe(0)
    })
  })

  describe('createEmployee', () => {
    it('rejects a create missing a required field (400)', async () => {
      const data = changeData({ baseSalary: undefined })

      await expect(
        service.createEmployee(report, EMPLOYEE_ID, data, 1),
      ).rejects.toThrow(BadRequestException)
      expect(roleFindOne).not.toHaveBeenCalled()
      expect(employeeBuild).not.toHaveBeenCalled()
    })

    it('rejects a role that does not belong to the report (400)', async () => {
      roleFindOne.mockResolvedValueOnce(null)

      await expect(
        service.createEmployee(report, EMPLOYEE_ID, changeData(), 1),
      ).rejects.toThrow(BadRequestException)
      expect(employeeBuild).not.toHaveBeenCalled()
    })

    it('builds and saves a new employee with the client id, ordinal and NULL score', async () => {
      employeeFindByPk.mockResolvedValueOnce(null)
      const row: Record<string, unknown> = { save: jest.fn() }
      employeeBuild.mockReturnValueOnce(row)

      await service.createEmployee(report, EMPLOYEE_ID, changeData(), 5)

      expect(roleFindOne).toHaveBeenCalledWith({
        where: { id: ROLE_ID, reportId: REPORT_ID },
        attributes: ['id'],
      })
      expect(employeeBuild).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          ordinal: 5,
          score: null,
          reportEmployeeRoleId: ROLE_ID,
        }),
      )
      expect(row.id).toBe(EMPLOYEE_ID)
      expect(row.save).toHaveBeenCalled()
    })

    it('upserts in place when the id already exists on this report', async () => {
      const existing = {
        id: EMPLOYEE_ID,
        reportId: REPORT_ID,
        update: jest.fn(),
      }
      employeeFindByPk.mockResolvedValueOnce(existing)

      await service.createEmployee(
        report,
        EMPLOYEE_ID,
        changeData({ baseSalary: 900000 }),
        5,
      )

      expect(existing.update).toHaveBeenCalledWith(
        expect.objectContaining({ baseSalary: 900000 }),
      )
      expect(employeeBuild).not.toHaveBeenCalled()
    })

    it('rejects a create whose id belongs to a different report (400)', async () => {
      const existing = {
        id: EMPLOYEE_ID,
        reportId: 'other-report',
        update: jest.fn(),
      }
      employeeFindByPk.mockResolvedValueOnce(existing)

      await expect(
        service.createEmployee(report, EMPLOYEE_ID, changeData(), 5),
      ).rejects.toThrow(BadRequestException)
      expect(existing.update).not.toHaveBeenCalled()
      expect(employeeBuild).not.toHaveBeenCalled()
    })
  })

  describe('updateEmployee', () => {
    it('patches only the provided employee fields', async () => {
      const row = {
        id: EMPLOYEE_ID,
        reportId: REPORT_ID,
        update: jest.fn(),
      }
      employeeFindOne.mockResolvedValueOnce(row)

      await service.updateEmployee(report, EMPLOYEE_ID, {
        baseSalary: 900000,
      })

      expect(employeeFindOne).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID, reportId: REPORT_ID },
      })
      expect(row.update).toHaveBeenCalledWith({ baseSalary: 900000 })
    })

    it('validates a re-assigned role on update (400)', async () => {
      employeeFindOne.mockResolvedValueOnce({
        id: EMPLOYEE_ID,
        reportId: REPORT_ID,
        update: jest.fn(),
      })
      roleFindOne.mockResolvedValueOnce(null)

      await expect(
        service.updateEmployee(report, EMPLOYEE_ID, {
          reportEmployeeRoleId: 'other-role',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('404s updating an employee not in the draft', async () => {
      employeeFindOne.mockResolvedValueOnce(null)

      await expect(
        service.updateEmployee(report, EMPLOYEE_ID, { field: 'x' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('removeEmployee', () => {
    it('destroys the personal-step and outlier rows, then the employee', async () => {
      const destroy = jest.fn()
      employeeFindOne.mockResolvedValueOnce({ id: EMPLOYEE_ID, destroy })

      await service.removeEmployee(report, EMPLOYEE_ID)

      expect(personalStepDestroy).toHaveBeenCalledWith({
        where: { reportEmployeeId: EMPLOYEE_ID },
      })
      expect(outlierDestroy).toHaveBeenCalledWith({
        where: { reportEmployeeId: EMPLOYEE_ID },
      })
      expect(destroy).toHaveBeenCalled()
    })

    it('404s removing an employee not in the draft', async () => {
      employeeFindOne.mockResolvedValueOnce(null)

      await expect(
        service.removeEmployee(report, EMPLOYEE_ID),
      ).rejects.toThrow(NotFoundException)
      expect(personalStepDestroy).not.toHaveBeenCalled()
      expect(outlierDestroy).not.toHaveBeenCalled()
    })
  })
})
