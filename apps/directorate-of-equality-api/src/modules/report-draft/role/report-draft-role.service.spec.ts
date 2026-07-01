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
import { ReportModel } from '../../report/models/report.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftRoleService } from './report-draft-role.service'

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

const report = { id: REPORT_ID } as ReportModel

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDraftRoleService', () => {
  let service: ReportDraftRoleService
  let findOwnedDraft: jest.Mock
  let roleFindAll: jest.Mock
  let roleFindOne: jest.Mock
  let roleFindByPk: jest.Mock
  let roleBuild: jest.Mock
  let employeeCount: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    roleFindAll = jest.fn().mockResolvedValue([])
    roleFindOne = jest.fn().mockResolvedValue(null)
    roleFindByPk = jest.fn().mockResolvedValue(null)
    roleBuild = jest.fn()
    employeeCount = jest.fn().mockResolvedValue(0)

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftRoleService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: {
            findAll: roleFindAll,
            findOne: roleFindOne,
            findByPk: roleFindByPk,
            build: roleBuild,
          },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { count: employeeCount },
        },
      ],
    }).compile()

    service = module.get(ReportDraftRoleService)
  })

  it('lists roles for the owned draft', async () => {
    roleFindAll.mockResolvedValueOnce([
      { id: ROLE_ID, title: 'Sérfræðingur', reportId: REPORT_ID },
    ])

    const result = await service.listRoles(PROVIDER_ID, COMPANY)

    expect(findOwnedDraft).toHaveBeenCalledWith(PROVIDER_ID, COMPANY)
    expect(result).toEqual([
      { id: ROLE_ID, title: 'Sérfræðingur', reportId: REPORT_ID },
    ])
  })

  it('creates a role with the client-minted id, trimming the title', async () => {
    roleFindByPk.mockResolvedValueOnce(null)
    const row: Record<string, unknown> = { save: jest.fn() }
    roleBuild.mockReturnValueOnce(row)

    await service.createRole(report, ROLE_ID, { title: '  Stjórnandi  ' })

    expect(roleBuild).toHaveBeenCalledWith({
      title: 'Stjórnandi',
      reportId: REPORT_ID,
    })
    expect(row.id).toBe(ROLE_ID)
    expect(row.save).toHaveBeenCalled()
  })

  it('upserts in place when the role id already exists on this draft', async () => {
    const existing = {
      id: ROLE_ID,
      reportId: REPORT_ID,
      update: jest.fn(),
    }
    roleFindByPk.mockResolvedValueOnce(existing)

    await service.createRole(report, ROLE_ID, { title: 'Stjórnandi' })

    expect(existing.update).toHaveBeenCalledWith({ title: 'Stjórnandi' })
    expect(roleBuild).not.toHaveBeenCalled()
  })

  it('rejects a create whose id belongs to a different report', async () => {
    const existing = {
      id: ROLE_ID,
      reportId: 'other-report',
      update: jest.fn(),
    }
    roleFindByPk.mockResolvedValueOnce(existing)

    await expect(
      service.createRole(report, ROLE_ID, { title: 'Stjórnandi' }),
    ).rejects.toThrow(BadRequestException)
    expect(existing.update).not.toHaveBeenCalled()
  })

  it('requires a title on create', async () => {
    await expect(
      service.createRole(report, ROLE_ID, { title: '   ' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('renames a role it owns', async () => {
    const row = {
      id: ROLE_ID,
      title: 'Old',
      reportId: REPORT_ID,
      update: jest.fn(),
    }
    roleFindOne.mockResolvedValueOnce(row)

    await service.updateRole(report, ROLE_ID, { title: 'New' })

    expect(roleFindOne).toHaveBeenCalledWith({
      where: { id: ROLE_ID, reportId: REPORT_ID },
    })
    expect(row.update).toHaveBeenCalledWith({ title: 'New' })
  })

  it('404s renaming a role not in the draft', async () => {
    roleFindOne.mockResolvedValueOnce(null)

    await expect(
      service.updateRole(report, ROLE_ID, { title: 'x' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('deletes an unreferenced role', async () => {
    const destroy = jest.fn()
    roleFindOne.mockResolvedValueOnce({ id: ROLE_ID, destroy })
    employeeCount.mockResolvedValueOnce(0)

    await service.removeRole(report, ROLE_ID)

    expect(destroy).toHaveBeenCalled()
  })

  it('409s deleting a role still assigned to employees', async () => {
    const destroy = jest.fn()
    roleFindOne.mockResolvedValueOnce({ id: ROLE_ID, destroy })
    employeeCount.mockResolvedValueOnce(2)

    await expect(service.removeRole(report, ROLE_ID)).rejects.toThrow(
      ConflictException,
    )
    expect(destroy).not.toHaveBeenCalled()
  })
})
