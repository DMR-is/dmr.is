import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftStepService } from './report-draft-step.service'

const REPORT_ID = 'report-id-1'
const CRITERION_ID = 'criterion-id-1'
const SUB_ID = 'sub-id-1'
const STEP_ID = 'step-id-1'
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

describe('ReportDraftStepService', () => {
  let service: ReportDraftStepService
  let findOwnedDraft: jest.Mock
  let criterionFindOne: jest.Mock
  let subFindOne: jest.Mock
  let stepFindAll: jest.Mock
  let stepFindOne: jest.Mock
  let stepCreate: jest.Mock
  let roleStepDestroy: jest.Mock
  let personalStepDestroy: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    criterionFindOne = jest.fn().mockResolvedValue({ id: CRITERION_ID })
    subFindOne = jest
      .fn()
      .mockResolvedValue({ id: SUB_ID, reportCriterionId: CRITERION_ID })
    stepFindAll = jest.fn().mockResolvedValue([])
    stepFindOne = jest.fn().mockResolvedValue(null)
    stepCreate = jest.fn()
    roleStepDestroy = jest.fn()
    personalStepDestroy = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftStepService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { findOne: criterionFindOne },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: { findOne: subFindOne },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: {
            findAll: stepFindAll,
            findOne: stepFindOne,
            create: stepCreate,
          },
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

    service = module.get(ReportDraftStepService)
  })

  it('creates a step under a sub-criterion in the draft', async () => {
    stepCreate.mockResolvedValueOnce({
      id: STEP_ID,
      order: 1,
      description: 'd',
      score: 3,
      reportSubCriterionId: SUB_ID,
    })

    const result = await service.createStep(PROVIDER_ID, COMPANY, SUB_ID, {
      order: 1,
      description: 'd',
      score: 3,
    })

    expect(stepCreate).toHaveBeenCalledWith(
      expect.objectContaining({ reportSubCriterionId: SUB_ID, order: 1 }),
    )
    expect(result.id).toBe(STEP_ID)
  })

  it('404s when the sub-criterion does not exist', async () => {
    subFindOne.mockResolvedValueOnce(null)

    await expect(
      service.listSteps(PROVIDER_ID, COMPANY, SUB_ID),
    ).rejects.toThrow(NotFoundException)
  })

  it('404s when the sub-criterion belongs to another draft', async () => {
    subFindOne.mockResolvedValueOnce({
      id: SUB_ID,
      reportCriterionId: CRITERION_ID,
    })
    criterionFindOne.mockResolvedValueOnce(null)

    await expect(
      service.listSteps(PROVIDER_ID, COMPANY, SUB_ID),
    ).rejects.toThrow(NotFoundException)
  })

  it('removes assignments then the step on delete', async () => {
    const destroy = jest.fn()
    stepFindOne.mockResolvedValueOnce({ id: STEP_ID, destroy })

    await service.deleteStep(PROVIDER_ID, COMPANY, SUB_ID, STEP_ID)

    expect(roleStepDestroy).toHaveBeenCalledWith({
      where: { reportSubCriterionStepId: STEP_ID },
    })
    expect(personalStepDestroy).toHaveBeenCalledWith({
      where: { reportSubCriterionStepId: STEP_ID },
    })
    expect(destroy).toHaveBeenCalled()
  })
})
