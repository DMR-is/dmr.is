import { BadRequestException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { IConfigService } from '../../config/config.service.interface'
import { GenderEnum, ReportTypeEnum } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import {
  deriveEmployeeScores,
  ReportDraftAnalysisService,
} from './report-draft-analysis.service'

const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY = {
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

describe('deriveEmployeeScores', () => {
  const employee = {
    id: 'emp-1',
    ordinal: 1,
    gender: GenderEnum.FEMALE,
    workRatio: 1,
    baseSalary: 100,
    reportEmployeeRoleId: 'role-1',
  }
  const stepScoreById = new Map([
    ['step-1', 2],
    ['step-2', 3],
    ['step-3', 5],
  ])

  it('sums the union of role and personal steps, counting a shared step once', async () => {
    const [scored] = deriveEmployeeScores(
      [employee],
      stepScoreById,
      new Map([['role-1', ['step-1', 'step-2']]]),
      // step-2 is shared (role + personal) → counted once; step-3 personal only.
      new Map([['emp-1', ['step-2', 'step-3']]]),
    )

    // 2 + 3 + 5 = 10 (step-2 not double-counted).
    expect(scored.score).toBe(10)
  })

  it('treats an unknown step id as 0 and a no-assignment employee as 0', async () => {
    const [roleOnly] = deriveEmployeeScores(
      [employee],
      stepScoreById,
      new Map([['role-1', ['step-1', 'ghost']]]),
      new Map(),
    )
    expect(roleOnly.score).toBe(2)

    const [none] = deriveEmployeeScores(
      [employee],
      stepScoreById,
      new Map(),
      new Map(),
    )
    expect(none.score).toBe(0)
  })
})

describe('ReportDraftAnalysisService', () => {
  let service: ReportDraftAnalysisService
  let findOwnedDraft: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn()

    const noopModel = {
      findAll: jest.fn().mockResolvedValue([]),
    }

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftAnalysisService,
        {
          provide: LOGGER_PROVIDER,
          useValue: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
        },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: IConfigService,
          useValue: {
            getByKey: jest.fn().mockResolvedValue({ value: '3.9' }),
          },
        },
        { provide: getModelToken(ReportEmployeeModel), useValue: noopModel },
        { provide: getModelToken(ReportCriterionModel), useValue: noopModel },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: noopModel,
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: noopModel,
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: noopModel,
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: noopModel,
        },
      ],
    }).compile()

    service = module.get(ReportDraftAnalysisService)
  })

  it('400s when the draft is an equality report', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: 'report-1',
      type: ReportTypeEnum.EQUALITY,
    })

    await expect(
      service.analyzeDraft(PROVIDER_ID, COMPANY),
    ).rejects.toThrow(BadRequestException)
  })

  it('returns an empty outlier list for a salary draft with no employees', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: 'report-1',
      type: ReportTypeEnum.SALARY,
    })

    const result = await service.analyzeDraft(PROVIDER_ID, COMPANY)

    expect(result.outliers).toEqual([])
  })
})
