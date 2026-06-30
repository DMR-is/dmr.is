import { ConflictException, NotFoundException } from '@nestjs/common'
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
  let roleCreate: jest.Mock
  let employeeCount: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    roleFindAll = jest.fn().mockResolvedValue([])
    roleFindOne = jest.fn().mockResolvedValue(null)
    roleCreate = jest.fn()
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
            create: roleCreate,
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

  it('creates a role scoped to the draft, trimming the title', async () => {
    roleCreate.mockResolvedValueOnce({
      id: ROLE_ID,
      title: 'Stjórnandi',
      reportId: REPORT_ID,
    })

    const result = await service.createRole(PROVIDER_ID, COMPANY, {
      title: '  Stjórnandi  ',
    })

    expect(roleCreate).toHaveBeenCalledWith({
      title: 'Stjórnandi',
      reportId: REPORT_ID,
    })
    expect(result.id).toBe(ROLE_ID)
  })

  it('renames a role it owns', async () => {
    const row = {
      id: ROLE_ID,
      title: 'Old',
      reportId: REPORT_ID,
      update: jest.fn(async function (this: Record<string, unknown>, vals) {
        Object.assign(row, vals)
      }),
    }
    roleFindOne.mockResolvedValueOnce(row)

    const result = await service.updateRole(PROVIDER_ID, COMPANY, ROLE_ID, {
      title: 'New',
    })

    expect(row.update).toHaveBeenCalledWith({ title: 'New' })
    expect(result.title).toBe('New')
  })

  it('404s renaming a role not in the draft', async () => {
    roleFindOne.mockResolvedValueOnce(null)

    await expect(
      service.updateRole(PROVIDER_ID, COMPANY, ROLE_ID, { title: 'x' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('deletes an unreferenced role', async () => {
    const destroy = jest.fn()
    roleFindOne.mockResolvedValueOnce({ id: ROLE_ID, destroy })
    employeeCount.mockResolvedValueOnce(0)

    await service.deleteRole(PROVIDER_ID, COMPANY, ROLE_ID)

    expect(destroy).toHaveBeenCalled()
  })

  it('409s deleting a role still assigned to employees', async () => {
    const destroy = jest.fn()
    roleFindOne.mockResolvedValueOnce({ id: ROLE_ID, destroy })
    employeeCount.mockResolvedValueOnce(2)

    await expect(
      service.deleteRole(PROVIDER_ID, COMPANY, ROLE_ID),
    ).rejects.toThrow(ConflictException)
    expect(destroy).not.toHaveBeenCalled()
  })
})
