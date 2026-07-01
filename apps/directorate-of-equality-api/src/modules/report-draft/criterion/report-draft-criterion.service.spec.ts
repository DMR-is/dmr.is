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
import {
  ReportCriterionModel,
  ReportCriterionTypeEnum,
} from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftCriterionService } from './report-draft-criterion.service'

const REPORT_ID = 'report-id-1'
const CRITERION_ID = 'criterion-id-1'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY = {
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

const report = { id: REPORT_ID } as ReportModel

const VALID_CREATE = {
  title: '  Ábyrgð  ',
  weight: 0.25,
  description: 'd',
  type: ReportCriterionTypeEnum.RESPONSIBILITY,
}

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDraftCriterionService', () => {
  let service: ReportDraftCriterionService
  let findOwnedDraft: jest.Mock
  let criterionFindAll: jest.Mock
  let criterionFindOne: jest.Mock
  let criterionFindByPk: jest.Mock
  let criterionBuild: jest.Mock
  let subFindAll: jest.Mock
  let subDestroy: jest.Mock
  let stepFindAll: jest.Mock
  let stepDestroy: jest.Mock
  let roleStepDestroy: jest.Mock
  let personalStepDestroy: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    criterionFindAll = jest.fn().mockResolvedValue([])
    criterionFindOne = jest.fn().mockResolvedValue(null)
    criterionFindByPk = jest.fn().mockResolvedValue(null)
    criterionBuild = jest.fn()
    subFindAll = jest.fn().mockResolvedValue([])
    subDestroy = jest.fn()
    stepFindAll = jest.fn().mockResolvedValue([])
    stepDestroy = jest.fn()
    roleStepDestroy = jest.fn()
    personalStepDestroy = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftCriterionService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: {
            findAll: criterionFindAll,
            findOne: criterionFindOne,
            findByPk: criterionFindByPk,
            build: criterionBuild,
          },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: { findAll: subFindAll, destroy: subDestroy },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: { findAll: stepFindAll, destroy: stepDestroy },
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: { destroy: roleStepDestroy },
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: { destroy: personalStepDestroy },
        },
      ],
    }).compile()

    service = module.get(ReportDraftCriterionService)
  })

  it('lists criteria for the owned draft', async () => {
    criterionFindAll.mockResolvedValueOnce([
      { id: CRITERION_ID, title: 'Ábyrgð', reportId: REPORT_ID },
    ])

    const result = await service.listCriteria(PROVIDER_ID, COMPANY)

    expect(findOwnedDraft).toHaveBeenCalledWith(PROVIDER_ID, COMPANY)
    expect(result).toEqual([
      { id: CRITERION_ID, title: 'Ábyrgð', reportId: REPORT_ID },
    ])
  })

  it('creates a criterion with the client-minted id, trimming the title', async () => {
    criterionFindByPk.mockResolvedValueOnce(null)
    const row: Record<string, unknown> = { save: jest.fn() }
    criterionBuild.mockReturnValueOnce(row)

    await service.createCriterion(report, CRITERION_ID, VALID_CREATE)

    expect(criterionBuild).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Ábyrgð', reportId: REPORT_ID }),
    )
    expect(row.id).toBe(CRITERION_ID)
    expect(row.save).toHaveBeenCalled()
  })

  it('upserts in place when the criterion id already exists on this draft', async () => {
    const existing = {
      id: CRITERION_ID,
      reportId: REPORT_ID,
      update: jest.fn(),
    }
    criterionFindByPk.mockResolvedValueOnce(existing)

    await service.createCriterion(report, CRITERION_ID, VALID_CREATE)

    expect(existing.update).toHaveBeenCalledWith({
      title: 'Ábyrgð',
      weight: 0.25,
      description: 'd',
      type: ReportCriterionTypeEnum.RESPONSIBILITY,
    })
    expect(criterionBuild).not.toHaveBeenCalled()
  })

  it('rejects a create whose id belongs to a different report', async () => {
    const existing = {
      id: CRITERION_ID,
      reportId: 'other-report',
      update: jest.fn(),
    }
    criterionFindByPk.mockResolvedValueOnce(existing)

    await expect(
      service.createCriterion(report, CRITERION_ID, VALID_CREATE),
    ).rejects.toThrow(BadRequestException)
    expect(existing.update).not.toHaveBeenCalled()
  })

  it('requires all fields on create', async () => {
    await expect(
      service.createCriterion(report, CRITERION_ID, { title: 'x' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('patches a criterion it owns', async () => {
    const row = { id: CRITERION_ID, update: jest.fn() }
    criterionFindOne.mockResolvedValueOnce(row)

    await service.updateCriterion(report, CRITERION_ID, { title: '  New  ' })

    expect(criterionFindOne).toHaveBeenCalledWith({
      where: { id: CRITERION_ID, reportId: REPORT_ID },
    })
    expect(row.update).toHaveBeenCalledWith({ title: 'New' })
  })

  it('404s updating a criterion not in the draft', async () => {
    criterionFindOne.mockResolvedValueOnce(null)

    await expect(
      service.updateCriterion(report, CRITERION_ID, { title: 'x' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('cascades the subtree on delete (steps → assignments → sub-criteria → criterion)', async () => {
    const destroy = jest.fn()
    criterionFindOne.mockResolvedValueOnce({ id: CRITERION_ID, destroy })
    subFindAll.mockResolvedValueOnce([{ id: 'sub-1' }, { id: 'sub-2' }])
    stepFindAll.mockResolvedValueOnce([{ id: 'step-1' }, { id: 'step-2' }])

    await service.removeCriterion(report, CRITERION_ID)

    expect(roleStepDestroy).toHaveBeenCalledWith({
      where: { reportSubCriterionStepId: ['step-1', 'step-2'] },
    })
    expect(personalStepDestroy).toHaveBeenCalledWith({
      where: { reportSubCriterionStepId: ['step-1', 'step-2'] },
    })
    expect(stepDestroy).toHaveBeenCalledWith({
      where: { id: ['step-1', 'step-2'] },
    })
    expect(subDestroy).toHaveBeenCalledWith({
      where: { id: ['sub-1', 'sub-2'] },
    })
    expect(destroy).toHaveBeenCalled()
  })

  it('deletes a childless criterion without touching step tables', async () => {
    const destroy = jest.fn()
    criterionFindOne.mockResolvedValueOnce({ id: CRITERION_ID, destroy })
    subFindAll.mockResolvedValueOnce([])

    await service.removeCriterion(report, CRITERION_ID)

    expect(stepDestroy).not.toHaveBeenCalled()
    expect(roleStepDestroy).not.toHaveBeenCalled()
    expect(subDestroy).not.toHaveBeenCalled()
    expect(destroy).toHaveBeenCalled()
  })
})
