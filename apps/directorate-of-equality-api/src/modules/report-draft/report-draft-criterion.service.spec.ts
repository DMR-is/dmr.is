import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import {
  ReportCriterionModel,
  ReportCriterionTypeEnum,
} from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from './report-draft.service.interface'
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
  let criterionCreate: jest.Mock
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
    criterionCreate = jest.fn()
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
            create: criterionCreate,
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

  it('creates a criterion scoped to the draft', async () => {
    criterionCreate.mockResolvedValueOnce({
      id: CRITERION_ID,
      title: 'Ábyrgð',
      weight: 0.25,
      description: 'd',
      type: ReportCriterionTypeEnum.RESPONSIBILITY,
      reportId: REPORT_ID,
    })

    const result = await service.createCriterion(PROVIDER_ID, COMPANY, {
      title: '  Ábyrgð  ',
      weight: 0.25,
      description: 'd',
      type: ReportCriterionTypeEnum.RESPONSIBILITY,
    })

    expect(criterionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Ábyrgð', reportId: REPORT_ID }),
    )
    expect(result.id).toBe(CRITERION_ID)
  })

  it('404s updating a criterion not in the draft', async () => {
    criterionFindOne.mockResolvedValueOnce(null)

    await expect(
      service.updateCriterion(PROVIDER_ID, COMPANY, CRITERION_ID, {
        title: 'x',
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('cascades the subtree on delete (steps → assignments → sub-criteria → criterion)', async () => {
    const destroy = jest.fn()
    criterionFindOne.mockResolvedValueOnce({ id: CRITERION_ID, destroy })
    subFindAll.mockResolvedValueOnce([{ id: 'sub-1' }, { id: 'sub-2' }])
    stepFindAll.mockResolvedValueOnce([{ id: 'step-1' }, { id: 'step-2' }])

    await service.deleteCriterion(PROVIDER_ID, COMPANY, CRITERION_ID)

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

    await service.deleteCriterion(PROVIDER_ID, COMPANY, CRITERION_ID)

    expect(stepDestroy).not.toHaveBeenCalled()
    expect(roleStepDestroy).not.toHaveBeenCalled()
    expect(subDestroy).not.toHaveBeenCalled()
    expect(destroy).toHaveBeenCalled()
  })
})
