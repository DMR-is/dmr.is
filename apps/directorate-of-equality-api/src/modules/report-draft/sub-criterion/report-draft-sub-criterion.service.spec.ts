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
import { ReportDraftSubCriterionService } from './report-draft-sub-criterion.service'

const REPORT_ID = 'report-id-1'
const CRITERION_ID = 'criterion-id-1'
const SUB_ID = 'sub-id-1'
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

describe('ReportDraftSubCriterionService', () => {
  let service: ReportDraftSubCriterionService
  let findOwnedDraft: jest.Mock
  let criterionFindOne: jest.Mock
  let subFindAll: jest.Mock
  let subFindOne: jest.Mock
  let subCreate: jest.Mock
  let stepFindAll: jest.Mock
  let stepDestroy: jest.Mock
  let roleStepDestroy: jest.Mock
  let personalStepDestroy: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    criterionFindOne = jest.fn().mockResolvedValue({ id: CRITERION_ID })
    subFindAll = jest.fn().mockResolvedValue([])
    subFindOne = jest.fn().mockResolvedValue(null)
    subCreate = jest.fn()
    stepFindAll = jest.fn().mockResolvedValue([])
    stepDestroy = jest.fn()
    roleStepDestroy = jest.fn()
    personalStepDestroy = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftSubCriterionService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { findOne: criterionFindOne },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: {
            findAll: subFindAll,
            findOne: subFindOne,
            create: subCreate,
          },
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

    service = module.get(ReportDraftSubCriterionService)
  })

  it('creates a sub-criterion under a criterion in the draft', async () => {
    subCreate.mockResolvedValueOnce({
      id: SUB_ID,
      title: 'Menntun',
      description: 'd',
      weight: 0.5,
      reportCriterionId: CRITERION_ID,
    })

    const result = await service.createSubCriterion(
      PROVIDER_ID,
      COMPANY,
      CRITERION_ID,
      { title: '  Menntun  ', description: 'd', weight: 0.5 },
    )

    expect(criterionFindOne).toHaveBeenCalledWith({
      where: { id: CRITERION_ID, reportId: REPORT_ID },
    })
    expect(subCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Menntun',
        reportCriterionId: CRITERION_ID,
      }),
    )
    expect(result.id).toBe(SUB_ID)
  })

  it('404s when the parent criterion is not in the draft', async () => {
    criterionFindOne.mockResolvedValueOnce(null)

    await expect(
      service.listSubCriteria(PROVIDER_ID, COMPANY, CRITERION_ID),
    ).rejects.toThrow(NotFoundException)
  })

  it('404s updating a sub-criterion not under the criterion', async () => {
    criterionFindOne.mockResolvedValueOnce({ id: CRITERION_ID })
    subFindOne.mockResolvedValueOnce(null)

    await expect(
      service.updateSubCriterion(PROVIDER_ID, COMPANY, CRITERION_ID, SUB_ID, {
        title: 'x',
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('cascades steps + assignments on delete', async () => {
    const destroy = jest.fn()
    criterionFindOne.mockResolvedValueOnce({ id: CRITERION_ID })
    subFindOne.mockResolvedValueOnce({ id: SUB_ID, destroy })
    stepFindAll.mockResolvedValueOnce([{ id: 'step-1' }])

    await service.deleteSubCriterion(PROVIDER_ID, COMPANY, CRITERION_ID, SUB_ID)

    expect(roleStepDestroy).toHaveBeenCalledWith({
      where: { reportSubCriterionStepId: ['step-1'] },
    })
    expect(personalStepDestroy).toHaveBeenCalledWith({
      where: { reportSubCriterionStepId: ['step-1'] },
    })
    expect(stepDestroy).toHaveBeenCalledWith({ where: { id: ['step-1'] } })
    expect(destroy).toHaveBeenCalled()
  })
})
