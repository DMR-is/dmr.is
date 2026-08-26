import { CompanySizeEnum } from '../../company/models/company.enums'
import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { PayStatusEnum } from '../../report/lib/wage-gap-decomposition'
import {
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../report/models/report.enums'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import {
  PayDispersionBlockerEnum,
  type PayDispersionDto,
  PayDispersionPopulationEnum,
} from '../../report-statistics/dto/pay-dispersion.dto'
import { SalaryByGenderAndScoreDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import {
  buildSalaryReportHtml,
  SalaryReportPdfData,
} from './salary-report-template'

function makeData(
  overrides: Partial<SalaryReportPdfData> = {},
): SalaryReportPdfData {
  const report = {
    id: 'r1',
    type: ReportTypeEnum.SALARY,
    status: ReportStatusEnum.APPROVED,
    companyAdminName: 'Jónína J. Jónsdóttir',
    companyAdminTitle: 'Framkvæmdastjóri',
    companyAdminEmail: 'jonina@mycompany.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Jón J. Jónsson',
    contactEmail: 'jon@mycompany.is',
    contactPhone: '+354 888-8888',
    averageEmployeeMaleCount: 25,
    averageEmployeeFemaleCount: 20,
    averageEmployeeNeutralCount: 3,
    correctionDeadline: new Date(2026, 4, 21),
    company: {
      name: 'Testing-hugbúnaður ehf.',
      nationalId: '000000-0000',
      address: 'Hafnarstræti 300',
      city: 'Reykjavík',
      postcode: '101',
      employeeCountCategory: CompanySizeEnum.LARGE,
      isatCategory: '62010 Hugbúnaðargerð',
    },
    subsidiaries: [],
    // The óleiðréttur card reads the frozen decomposition, not
    // `totals.wageGapPercent`. Values below are consistent with the averages in
    // `statistics`: (1.065.400 − 983.100) / 1.065.400 = 7,72%, women lower.
    result: {
      wageGapDecomposition: {
        rawGapPercent: 7.72,
        rawGapDirection: 'FEMALE',
        // The default fixture is a COMPLIANT company, stated explicitly rather
        // than implied by `outliers` being empty. The úrbótaáætlun's empty state
        // reads this flag, so leaving it out would make the compliant copy the
        // fixture's accident instead of its subject.
        oskyrtWithinBenchmark: true,
      },
    },
  } as unknown as ReportDetailDto

  const statistics: SalaryByGenderAndScoreDto = {
    dataPoints: [
      { score: 200, regularHourlyWage: 600000, gender: GenderEnum.MALE },
      { score: 500, regularHourlyWage: 900000, gender: GenderEnum.FEMALE },
    ],
    regressionLine: { slope: 1000, intercept: 400000, rSquared: 1 },
    scoreBuckets: [],
    totals: {
      maleAverageSalary: 1065400,
      femaleAverageSalary: 983100,
      overallAverageSalary: 1024250,
      maleMedianSalary: 1000000,
      femaleMedianSalary: 950000,
      overallMedianSalary: 975000,
      // Deliberately NOT what the card renders — kept only to show that the
      // asymmetric `(male − female) / male` figure is no longer read for
      // display. It also never agreed with the averages above (6,33 vs 7,72).
      wageGapPercent: 6.33,
      maleCount: 1,
      femaleCount: 1,
    },
  }

  return { report, statistics, outliers: [], ...overrides }
}

describe('buildSalaryReportHtml', () => {
  it('renders all overview sections', () => {
    const html = buildSalaryReportHtml(makeData())

    expect(html).toContain('Jafnlaunaúttekt')
    expect(html).toContain('Testing-hugbúnaður ehf.')
    expect(html).toContain('000000-0000')
    expect(html).toContain('Æðsti stjórnandi')
    expect(html).toContain('Framkvæmdastjóri')
    expect(html).toContain('Tengiliður')
    expect(html).toContain('Meðalfjöldi starfsmanna á ársgrundvelli')
    expect(html).toContain('Dótturfyrirtæki')
    expect(html).toContain('Launagreining')
    expect(html).toContain('Úrbótaáætlun')
    expect(html).toContain('Frestur til úrbóta')
  })

  /**
   * The óleiðréttur figure is a MAGNITUDE with an explicit direction, matching
   * the web card. A signed percentage was considered and rejected: with the
   * denominator fixed to men, the same inequality yields a different magnitude
   * depending on which gender is ahead.
   */
  it('renders the salary stat cards with is-IS formatting and a directional gap', () => {
    const html = buildSalaryReportHtml(makeData())

    expect(html).toContain('1.065.400')
    expect(html).toContain('983.100')
    expect(html).toContain('7,7%')
    expect(html).toContain('í óhag kvenna')
    // The rejected form must not appear.
    expect(html).not.toContain('+6,3%')
    expect(html).toContain('21.05.2026')
    expect(html).toContain('<svg')
  })

  // An empty lágmarksmengi is a FINDING, not an absence: it means óskýrt is
  // already under the benchmark. The old copy ("Engin frávik skráð") read as
  // "nothing was recorded", which is the opposite impression.
  it('states that no corrections are needed when the lágmarksmengi is empty', () => {
    const html = buildSalaryReportHtml(makeData())

    expect(html).toContain('Engin dótturfyrirtæki skráð.')
    expect(html).toContain(
      'Engar úrbætur nauðsynlegar — óskýrður launamunur er undir viðmiði.',
    )
  })

  /**
   * ⚠️ The regression this section exists to prevent.
   *
   * An empty list used to imply compliance and no longer does: the
   * two-directional walk probes before committing and can decline every
   * candidate, so a company over the benchmark can come back with nothing
   * listed (see the 4,88% four-employee cohort in
   * `wage-gap-decomposition.spec.ts`). Keyed on `outliers.length` alone this
   * would print *engar úrbætur nauðsynlegar* onto the PDF of record.
   */
  it('does not claim compliance for an empty set on a company over the benchmark', () => {
    const data = makeData()
    const html = buildSalaryReportHtml({
      ...data,
      report: {
        ...data.report,
        result: {
          ...data.report.result,
          wageGapDecomposition: {
            ...data.report.result?.wageGapDecomposition,
            oskyrtWithinBenchmark: false,
          },
        },
      } as unknown as ReportDetailDto,
    })

    expect(html).not.toContain('Engar úrbætur nauðsynlegar')
    expect(html).toContain('Óskýrður launamunur er yfir viðmiði')
    expect(html).toContain('krefst yfirferðar')
  })

  /**
   * Absent, not false — the shape an older frozen snapshot has, and the shape
   * every report has before its result is computed. `undefined === true` is
   * false, so this must not read as compliant either; it must not read as a
   * failed walk either, because no walk was run.
   */
  it('claims neither compliance nor a failed walk when the flag is absent', () => {
    const data = makeData()
    const html = buildSalaryReportHtml({
      ...data,
      report: {
        ...data.report,
        result: undefined,
      } as unknown as ReportDetailDto,
    })

    expect(html).not.toContain('Engar úrbætur nauðsynlegar')
    expect(html).not.toContain('Óskýrður launamunur er yfir viðmiði')
    expect(html).toContain('Ekkert lágmarksmengi var valið')
  })

  describe('ábendingar um launadreifingu', () => {
    /**
     * ⚠️ Typed as the DTO, deliberately. With `unknown` these four fixtures were
     * unchecked against `PayDispersionDto` — renaming `employeeOrdinal` would
     * have rendered "Starfsmaður undefined" with all four tests still passing.
     * The absent-field case below opts out explicitly, because that is the one
     * scenario whose whole point is a payload that does NOT match the type.
     */
    const withPayDispersion = (payDispersion: PayDispersionDto | undefined) => {
      const data = makeData()
      return buildSalaryReportHtml({
        ...data,
        report: {
          ...data.report,
          result: { ...data.report.result, payDispersion },
        } as unknown as ReportDetailDto,
      })
    }

    it('renders the advisory table, and says outright that it asks nothing', () => {
      const html = withPayDispersion({
        available: true,
        blockers: [],
        population: PayDispersionPopulationEnum.ALL_EMPLOYEES,
        threshold: 2,
        cohortResidualSpreadPercentUp: 25.67,
        cohortResidualSpreadPercentDown: -20.43,
        employees: [
          {
            employeeOrdinal: 70,
            gender: GenderEnum.MALE,
            score: 655,
            regularHourlyWage: 7800,
            expectedHourlyWage: 4488,
            deviationPercent: 73.8,
            payStatus: PayStatusEnum.OVERPAID,
            studentizedResidual: 2.53,
          },
        ],
      })

      expect(html).toContain('Ábendingar um launadreifingu')
      expect(html).toContain('Starfsmaður 70')
      expect(html).toContain('+73,8% (yfir)')
      // Spreads, not a percentage — the two columns sit side by side and must
      // not be confusable.
      expect(html).toContain('+2,53')
      // Both ends, no ±: the spread is symmetric in log points and asymmetric in
      // krónur, so one figure with a ± overstates the downward band by ~5pp.
      expect(html).toContain('-20,4% til +25,7%')
      expect(html).not.toContain('±')

      // ⚠️ The sentence that stops a reader treating this as a second
      // úrbótaáætlun. If this assertion is ever deleted, so is the distinction.
      expect(html).toContain('Engra skýringa er krafist')
      expect(html).toContain('engin áhrif á afgreiðslu skýrslunnar')

      // And none of the obligation-bearing vocabulary leaks in.
      expect(html).not.toContain('Hlutur af óskýrðu')
    })

    /**
     * ⚠️ The pre-wired half. `EXCLUDING_MINIMUM_SET` is computed and shipped so
     * the contract is ready, but its framing is not agreed — so it must produce
     * **no section at all**, not an empty one. A heading over nothing reads as a
     * finding that failed to print.
     */
    it('renders no section at all for the population that is not yet approved', () => {
      const html = withPayDispersion({
        available: true,
        blockers: [],
        population: PayDispersionPopulationEnum.EXCLUDING_MINIMUM_SET,
        threshold: 2,
        cohortResidualSpreadPercentUp: 26.1,
        cohortResidualSpreadPercentDown: -20.7,
        employees: [
          {
            employeeOrdinal: 1,
            gender: GenderEnum.FEMALE,
            score: 500,
            regularHourlyWage: 7000,
            expectedHourlyWage: 4060,
            deviationPercent: 72.4,
            payStatus: PayStatusEnum.OVERPAID,
            studentizedResidual: 2.49,
          },
        ],
      })

      expect(html).not.toContain('Ábendingar um launadreifingu')
      expect(html).not.toContain('Starfsmaður 1<')
    })

    it('distinguishes "cannot be assessed" from "nothing to report"', () => {
      const blocked = withPayDispersion({
        available: false,
        blockers: [PayDispersionBlockerEnum.COHORT_TOO_SMALL],
        population: PayDispersionPopulationEnum.ALL_EMPLOYEES,
        threshold: 2,
        cohortResidualSpreadPercentUp: null,
        cohortResidualSpreadPercentDown: null,
        employees: [],
      })
      const allClear = withPayDispersion({
        available: true,
        blockers: [],
        population: PayDispersionPopulationEnum.ALL_EMPLOYEES,
        threshold: 2,
        cohortResidualSpreadPercentUp: 4.2,
        cohortResidualSpreadPercentDown: -4.03,
        employees: [],
      })

      expect(blocked).toContain('Of fáir starfsmenn')
      expect(blocked).not.toContain('Engar ábendingar')

      expect(allClear).toContain('Engar ábendingar')
      expect(allClear).not.toContain('Of fáir starfsmenn')
    })

    /**
     * ⚠️ Blocked AND `EXCLUDING_MINIMUM_SET` — an over-benchmark company under the
     * n=12 floor. This is the combination the `available &&` clause in the gate
     * exists for: without it the section vanishes and the company is told nothing,
     * which is the bug this whole commit was written to fix.
     */
    it('still explains itself when blocked on the not-yet-approved population', () => {
      const html = withPayDispersion({
        available: false,
        blockers: [PayDispersionBlockerEnum.COHORT_TOO_SMALL],
        population: PayDispersionPopulationEnum.EXCLUDING_MINIMUM_SET,
        threshold: 2,
        cohortResidualSpreadPercentUp: null,
        cohortResidualSpreadPercentDown: null,
        employees: [],
      })

      expect(html).toContain('Ábendingar um launadreifingu')
      expect(html).toContain('Of fáir starfsmenn')
      // ...but still no table and no advisory framing, since nothing was produced.
      expect(html).not.toContain('Engra skýringa er krafist')
    })

    it('renders nothing when the field is absent, as on an older API response', () => {
      const html = withPayDispersion(undefined)

      expect(html).not.toContain('Ábendingar um launadreifingu')
    })
  })

  it('renders lágmarksmengi rows with actual, expected, deviation and share', () => {
    const outliers = [
      {
        employeeOrdinal: 3,
        roleTitle: 'Sérfræðingur',
        gender: GenderEnum.FEMALE,
        regularHourlyWage: 4750,
        expectedHourlyWage: 5000,
        deviationPercent: -5,
        payStatus: 'UNDERPAID',
        contributionShare: 42.5,
      },
      // The other direction, in the same table. A PDF reader cannot ask which
      // way a row runs, and both admin tables spell it out, so this one must
      // too — the sign alone only works for a reader who knows the convention.
      {
        employeeOrdinal: 7,
        roleTitle: 'Deildarstjóri',
        gender: GenderEnum.MALE,
        regularHourlyWage: 6300,
        expectedHourlyWage: 6000,
        deviationPercent: 5,
        payStatus: 'OVERPAID',
        contributionShare: 31,
      },
    ] as unknown as ReportEmployeeOutlierDto[]

    const html = buildSalaryReportHtml(makeData({ outliers }))

    expect(html).toContain('Starfsmaður 3')
    expect(html).toContain('Sérfræðingur')
    // Units on the rates, not bare numbers — 4.750 alone reads as a monthly
    // salary two orders of magnitude too low.
    expect(html).toContain('4.750 kr./klst.')
    expect(html).toContain('5.000 kr./klst.')
    expect(html).toContain('42,5%')
    expect(html).toContain('Hlutur af óskýrðu')
    expect(html).not.toContain('Engar úrbætur nauðsynlegar')

    // Direction in words on BOTH rows, beside the signed percentage. Asserted
    // as the whole cell rather than as two separate substrings, so a regression
    // that drops the word cannot pass on the percentage alone.
    expect(html).toContain('-5,0% (undir)')
    expect(html).toContain('+5,0% (yfir)')
    expect(html).toContain('Deildarstjóri')
  })
})
