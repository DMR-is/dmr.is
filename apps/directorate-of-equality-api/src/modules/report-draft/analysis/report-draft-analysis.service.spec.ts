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
import { WageGapBlockerEnum } from '../../report/lib/wage-gap-decomposition'
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
  // Only the scoring is under test here, but `ScorableEmployee` carries the pay
  // fields too, so they must be present — omitting them silently passed
  // `undefined` into the wage components until the spec project was typechecked.
  const employee = {
    id: 'emp-1',
    ordinal: 1,
    gender: GenderEnum.FEMALE,
    paidHours: 200,
    baseSalary: 800000,
    additionalSalary: 0,
    bonusSalary: null,
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

  // Starf rides along with the score so `analyzeDraft` can denormalise it onto
  // each outlier row. Reading it off the eager-loaded `role` association is the
  // whole mechanism, so it is asserted rather than assumed.
  it('carries the loaded role title through, and nulls it when absent', async () => {
    const [withRole] = deriveEmployeeScores(
      [{ ...employee, role: { title: 'Sérfræðingur' } }],
      stepScoreById,
      new Map(),
      new Map(),
    )
    expect(withRole.roleTitle).toBe('Sérfræðingur')

    const [withoutRole] = deriveEmployeeScores(
      [employee],
      stepScoreById,
      new Map(),
      new Map(),
    )
    expect(withoutRole.roleTitle).toBeNull()
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
  let employeeModel: { findAll: jest.Mock }
  let criterionModel: { findAll: jest.Mock }
  let subCriterionModel: { findAll: jest.Mock }
  let stepModel: { findAll: jest.Mock }
  let roleStepModel: { findAll: jest.Mock }

  beforeEach(async () => {
    findOwnedDraft = jest.fn()

    const noopModel = {
      findAll: jest.fn().mockResolvedValue([]),
    }

    // Addressable per-model mocks, so a test can populate the draft's scoring
    // graph. `noopModel` is shared by every model that stays empty.
    employeeModel = { findAll: jest.fn().mockResolvedValue([]) }
    criterionModel = { findAll: jest.fn().mockResolvedValue([]) }
    subCriterionModel = { findAll: jest.fn().mockResolvedValue([]) }
    stepModel = { findAll: jest.fn().mockResolvedValue([]) }
    roleStepModel = { findAll: jest.fn().mockResolvedValue([]) }

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
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: employeeModel,
        },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: criterionModel,
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: subCriterionModel,
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: stepModel,
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: roleStepModel,
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: noopModel,
        },
      ],
    }).compile()

    service = module.get(ReportDraftAnalysisService)
  })

  /**
   * Populates the draft's scoring graph: two roles carrying different steps
   * (Manager 20 stig, Clerk 10 stig, matching `salary-analysis.spec.ts`) and the
   * eight employees scored against them, each with its `role` association
   * loaded the way the service's `include` loads it.
   */
  function givenScoringGraph(): void {
    employeeModel.findAll.mockResolvedValue(
      DRAFT_EMPLOYEES.map((e) => ({
        id: `emp-${e.ordinal}`,
        ordinal: e.ordinal,
        gender: e.gender,
        reportEmployeeRoleId: `role-${e.role}`,
        role: { id: `role-${e.role}`, title: e.role },
        paidHours: PAID_HOURS,
        baseSalary: e.baseSalary,
        additionalSalary: 0,
        bonusSalary: null,
      })),
    )
    criterionModel.findAll.mockResolvedValue([{ id: 'crit-1' }])
    subCriterionModel.findAll.mockResolvedValue([{ id: 'sub-1' }])
    stepModel.findAll.mockResolvedValue([
      { id: 'step-clerk', score: 10 },
      { id: 'step-manager', score: 20 },
    ])
    roleStepModel.findAll.mockResolvedValue([
      {
        reportEmployeeRoleId: 'role-Manager',
        reportSubCriterionStepId: 'step-manager',
      },
      {
        reportEmployeeRoleId: 'role-Clerk',
        reportSubCriterionStepId: 'step-clerk',
      },
    ])
  }

  it('400s when the draft is an equality report', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: 'report-1',
      type: ReportTypeEnum.EQUALITY,
    })

    await expect(service.analyzeDraft(PROVIDER_ID, COMPANY)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('returns an empty outlier list for a salary draft with no employees', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: 'report-1',
      type: ReportTypeEnum.SALARY,
    })

    const result = await service.analyzeDraft(PROVIDER_ID, COMPANY)

    expect(result.outliers).toEqual([])
  })

  /**
   * Starf on every outlier row, read from the DB rather than joined by the
   * client.
   *
   * This is the case the client-side join could not serve at all: the report
   * states that surface this analysis are not all granted the draft
   * employee/role reads, so the column was permanently blank there. Asserting
   * per row (rather than on the first) is deliberate — a first-row-only title
   * is precisely what was seen on dev.
   */
  it('denormalises each outlier’s Starf onto the analysis response', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: 'report-1',
      type: ReportTypeEnum.SALARY,
    })
    givenScoringGraph()

    const result = await service.analyzeDraft(PROVIDER_ID, COMPANY)

    // Guards the assertion below against passing vacuously.
    expect(result.outliers.length).toBeGreaterThan(0)
    for (const outlier of result.outliers) {
      expect(outlier.roleTitle).toBe(
        ROLE_TITLE_BY_ORDINAL.get(outlier.employeeOrdinal),
      )
    }
  })

  // The mechanism behind the test above: without the eager-loaded association
  // every `roleTitle` silently degrades to null, and no numeric assertion
  // anywhere would notice.
  it('eager-loads the role association when reading the draft employees', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: 'report-1',
      type: ReportTypeEnum.SALARY,
    })
    givenScoringGraph()

    await service.analyzeDraft(PROVIDER_ID, COMPANY)

    expect(employeeModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'role' }),
        ]),
      }),
    )
  })

  // The "always return the shape" contract, on the emptiest possible draft.
  // An absent `wageGapDecomposition` would reach the web as `undefined` and
  // render as a confident 0% — the exact failure `available: false` exists to
  // prevent.
  it('still returns a decomposition, blocked and counted, for an empty draft', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: 'report-1',
      type: ReportTypeEnum.SALARY,
    })

    const { wageGapDecomposition: gap } = await service.analyzeDraft(
      PROVIDER_ID,
      COMPANY,
    )

    expect(gap.rawGapAvailable).toBe(false)
    expect(gap.oskyrtAvailable).toBe(false)
    expect(gap.rawGapBlockers).toEqual(
      expect.arrayContaining([
        WageGapBlockerEnum.EMPTY_MALE_COHORT,
        WageGapBlockerEnum.EMPTY_FEMALE_COHORT,
      ]),
    )
    expect(gap.oskyrtPercent).toBeNull()
    expect(gap.counts).toEqual({ male: 0, female: 0, excluded: 0 })
    expect(gap.benchmarkPercent).toBe(3.9)
  })
})

/**
 * A salary draft whose óskýrður launamunur breaches 3,9%, so the lágmarksmengi
 * is non-empty and there are outlier rows to carry a Starf. Mirrors the cohort
 * in `salary-analysis.spec.ts` so the DB-state path and the parsed-payload path
 * are exercised over the same numbers.
 */
const PAID_HOURS = 173.33

const DRAFT_EMPLOYEES = [
  { ordinal: 1, gender: GenderEnum.MALE, role: 'Manager', baseSalary: 760_000 },
  { ordinal: 2, gender: GenderEnum.MALE, role: 'Manager', baseSalary: 745_000 },
  { ordinal: 3, gender: GenderEnum.MALE, role: 'Clerk', baseSalary: 625_000 },
  { ordinal: 4, gender: GenderEnum.MALE, role: 'Clerk', baseSalary: 610_000 },
  {
    ordinal: 5,
    gender: GenderEnum.FEMALE,
    role: 'Manager',
    baseSalary: 720_000,
  },
  {
    ordinal: 6,
    gender: GenderEnum.FEMALE,
    role: 'Manager',
    baseSalary: 705_000,
  },
  { ordinal: 7, gender: GenderEnum.FEMALE, role: 'Clerk', baseSalary: 600_000 },
  { ordinal: 8, gender: GenderEnum.FEMALE, role: 'Clerk', baseSalary: 592_000 },
]

const ROLE_TITLE_BY_ORDINAL = new Map(
  DRAFT_EMPLOYEES.map((e) => [e.ordinal, e.role]),
)
