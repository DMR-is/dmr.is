import { CompanySizeEnum } from '../../company/models/company.enums'
import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { PayStatusEnum } from '../../report/lib/wage-gap-decomposition'
import {
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import {
  PayDispersionBlockerEnum,
  type PayDispersionDto,
  type PayDispersionEmployeeDto,
  PayDispersionPopulationEnum,
} from '../../report-statistics/dto/pay-dispersion.dto'
import { SalaryByGenderAndScoreDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import { PAY_DISPERSION_LIST_CEILING } from '../../report-statistics/lib/pay-dispersion'
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
    contactTitle: 'Starfsmannastjóri',
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
        // Stated for the same reason: the leiðréttur block splits on
        // `oskyrtAvailable`, so omitting it silently put the default fixture —
        // a company with a computed, compliant gap — down the "cannot compute"
        // branch.
        oskyrtAvailable: true,
        oskyrtPercent: 2.1,
        oskyrtDirection: 'FEMALE',
        benchmarkPercent: 3.9,
        oskyrtBlockers: [],
        warnings: [],
        counts: { male: 8, female: 6, excluded: 0 },
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
    expect(html).toContain('Starfsmannastjóri')
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
    /**
     * Takes a partial and fills the rest, so a case states only the fields it is
     * actually about.
     *
     * ⚠️ **The counts default to the row set's own composition** — i.e. "nothing
     * was capped", which is true of every case here except the ones deliberately
     * exercising the cap. Without that default a literal that sets `employees`
     * and omits `countBelowExpected` would fall into the all-clear branch, and
     * the case would assert against a section that never rendered.
     */
    const withPayDispersion = (
      payDispersion?: Partial<PayDispersionDto>,
    ): string => {
      const data = makeData()
      const rows = payDispersion?.employees ?? []
      const complete: PayDispersionDto | undefined = payDispersion && {
        available: true,
        blockers: [],
        population: PayDispersionPopulationEnum.ALL_EMPLOYEES,
        threshold: 2,
        cohortResidualSpreadPercentUp: null,
        cohortResidualSpreadPercentDown: null,
        employees: [],
        chanceCriticalSpreads: null,
        ...payDispersion,
        // After the spread, so an explicit count still wins.
        countBelowExpected:
          payDispersion.countBelowExpected ??
          rows.filter((row) => row.studentizedResidual < 0).length,
        countAboveExpected:
          payDispersion.countAboveExpected ??
          rows.filter((row) => row.studentizedResidual > 0).length,
      }

      return buildSalaryReportHtml({
        ...data,
        report: {
          ...data.report,
          result: { ...data.report.result, payDispersion: complete },
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

      /*
        ⚠️ The CLASS, not just the words — otherwise reverting the stylesheet
        change is invisible to this suite.

        `.empty-note` is #8a8aa0 = 3.37:1, below WCAG AA. That is defensible for
        a genuine absence ("Engin dótturfyrirtæki skráð") and wrong for prose a
        reader has to act on, so the advisory section uses `.advisory-note`
        (#43425a = 9.70:1) and `.advisory-note--lead` (#00003c = 19.71:1) for the
        no-obligation sentence. Asserted per-paragraph rather than by counting,
        so moving one sentence back to the faint class fails here.
      */
      expect(html).toContain(
        '<p class="advisory-note--lead">Engra skýringa er krafist',
      )
      expect(html).toContain(
        '<p class="advisory-note">Laun þessara starfsmanna víkja',
      )
      expect(html).toContain('<p class="advisory-note">Dæmigerð dreifing')

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

    const row = (
      ordinal: number,
      studentizedResidual: number,
    ): PayDispersionEmployeeDto => ({
      employeeOrdinal: ordinal,
      gender: GenderEnum.FEMALE,
      score: 500,
      regularHourlyWage: 4000,
      expectedHourlyWage: 4400,
      deviationPercent: studentizedResidual < 0 ? -9.1 : 9.1,
      payStatus:
        studentizedResidual < 0 ? PayStatusEnum.UNDERPAID : PayStatusEnum.OVERPAID,
      studentizedResidual,
    })

    /**
     * ⚠️ The two directions are separate findings, and the heading carries the
     * TRUE count while the table carries the shortlist. A reader who takes the
     * table's length for the finding has been told something false.
     */
    it('splits the list by direction and states the true totals', () => {
      const html = withPayDispersion({
        cohortResidualSpreadPercentUp: 19.55,
        cohortResidualSpreadPercentDown: -16.35,
        employees: [
          ...Array.from({ length: 10 }, (_, i) => row(i + 1, -3 + i * 0.05)),
          ...Array.from({ length: 10 }, (_, i) => row(i + 20, 3 - i * 0.05)),
        ],
        countBelowExpected: 24,
        countAboveExpected: 22,
        chanceCriticalSpreads: 4.29,
      })

      expect(html).toContain('Undir væntanlegu tímakaupi — 24')
      expect(html).toContain('Yfir væntanlegu tímakaupi — 22')
      // The totals, not the row count.
      expect(html).toContain(
        'Starfsmenn sem víkja 2 staðalvik eða meira frá línunni: 24 niður, 22 upp.',
      )
      // Said outright, because ten rows under a heading reading 24 is otherwise
      // a discrepancy the reader has to resolve alone.
      expect(html).toContain('Þeir 10 sem víkja mest eru sýndir hér.')
      // ⚠️ Context, not a cut-off — and no sign on it, since the sentence
      // already carries no direction.
      expect(html).toContain(
        'Hjá fyrirtæki af þessari stærð fer sjaldnast nokkur starfsmaður yfir 4,29 staðalvik',
      )
      // Two tables, one per direction.
      expect(html.match(/<table class="data-table">/g)?.length).toBe(2)
    })

    it('says nothing about a shortlist when nothing was cut', () => {
      const html = withPayDispersion({
        employees: [row(1, -2.4), row(2, 2.1)],
      })

      expect(html).toContain('Undir væntanlegu tímakaupi — 1')
      expect(html).toContain('Yfir væntanlegu tímakaupi — 1')
      expect(html).not.toContain('sem víkja mest eru sýndir hér')
    })

    it('renders only the direction that has anything', () => {
      const html = withPayDispersion({ employees: [row(1, -2.4), row(2, -2.2)] })

      expect(html).toContain('Undir væntanlegu tímakaupi — 2')
      expect(html).not.toContain('Yfir væntanlegu tímakaupi')
      // A heading over an empty table reads as a finding that failed to print.
      expect(html.match(/<table class="data-table">/g)?.length).toBe(1)
    })

    /**
     * ⚠️ Splitting a tie is accepted only past the ceiling, so the surface has no
     * special case for it — the count carries the truth and the rows are simply
     * the most extreme 50. An earlier design rendered a prose sentence instead;
     * see `PAY_DISPERSION_LIST_CEILING` for why that was removed.
     */
    it('states the total even when the ceiling cut the rows', () => {
      const html = withPayDispersion({
        employees: Array.from({ length: PAY_DISPERSION_LIST_CEILING }, (_, i) =>
          row(i + 1, -2.51),
        ),
        countBelowExpected: 312,
        countAboveExpected: 0,
      })

      expect(html).toContain('Undir væntanlegu tímakaupi — 312')
      expect(html).toContain('Þeir 50 sem víkja mest eru sýndir hér.')
      expect(html).not.toContain('Engar ábendingar')
      expect(html).not.toContain('Yfir væntanlegu tímakaupi')
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
        // Stated rather than inferred: the all-clear is now keyed on these, and
        // an empty row set alone no longer means it.
        countBelowExpected: 0,
        countAboveExpected: 0,
      })

      expect(blocked).toContain('Of fáir starfsmenn')
      expect(blocked).not.toContain('Engar ábendingar')

      expect(allClear).toContain('Engar ábendingar')
      expect(allClear).not.toContain('Of fáir starfsmenn')

      // Both are the ENTIRE content of their section, so neither may be faint.
      expect(blocked).toContain('<p class="advisory-note">Of fáir starfsmenn')
      expect(allClear).toContain('<p class="advisory-note">Engar ábendingar')
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

  /**
   * ⚠️ **The rows are NOT here any more — they are their own document.** See
   * `improvement-plan-template.spec.ts`.
   *
   * This section used to render every outlier in one flat table with no group
   * name, ástæða, aðgerð or signature, because `fetchAllOutliers` pages
   * `getOutliers` without a `groupId`. What stays behind is the count (so a
   * reader knows the plan is non-empty without opening the other file) and the
   * pointer (so the heading is not left over nothing).
   */
  it('replaces the flat outlier table with a count and a pointer to the separate document', () => {
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

    expect(html).toContain('Úrbótaáætlun')
    expect(html).toContain('Starfsmenn í úrbótaáætlun: 2')
    /*
     * ⚠️ "í sérstöku skjali", not "fylgir þessari skýrslu". This section renders
     * off the ungrouped outlier list while `generateImprovementPlanPdf` returns
     * null whenever no group has members, so the plan can be absent with
     * outliers present — and the same sentence has to hold for a standalone
     * download from the report sidebar and for an approval whose plan render
     * failed.
     */
    expect(html).toContain('í sérstöku skjali')
    expect(html).not.toContain('fylgir þessari skýrslu')
    // The empty-state finding must not appear on a report that has a plan.
    expect(html).not.toContain('Engar úrbætur nauðsynlegar')
    // The per-employee rows moved out; only the pay-dispersion advisory below
    // still names individuals, and it is not fed by `outliers`.
    expect(html).not.toContain('Sérfræðingur')
    expect(html).not.toContain('Deildarstjóri')
  })

  describe('leiðréttur launamunur', () => {
    it('renders the compliance figure and the benchmark verdict', () => {
      const html = buildSalaryReportHtml(makeData())

      expect(html).toContain('Leiðréttur launamunur')
      expect(html).toContain('2,1%')
      expect(html).toContain('3,9%')
      expect(html).toContain('Undir viðmiði')
      expect(html).not.toContain('Yfir viðmiði')
    })

    /**
     * ⚠️ Only an explicit `true` may claim compliance. `oskyrtWithinBenchmark` is
     * nullable on a snapshot frozen before it existed, and `null === false` is
     * `false` — a `=== false` test would print *Undir viðmiði* over a live gap.
     */
    it('reads a missing compliance flag as over the benchmark', () => {
      const html = buildSalaryReportHtml(
        makeData({
          report: {
            ...makeData().report,
            result: {
              wageGapDecomposition: {
                ...makeData().report.result?.wageGapDecomposition,
                oskyrtWithinBenchmark: undefined,
              },
            },
          } as unknown as ReportDetailDto,
        }),
      )

      expect(html).toContain('Yfir viðmiði')
      expect(html).not.toContain('Undir viðmiði')
    })

    /**
     * Unavailable is a state the engine reports WITH REASONS, and the reasons
     * are the actionable half of the message. The counts stay real even when the
     * figures cannot be.
     */
    it('explains why the gap cannot be computed, with the real cohort counts', () => {
      const html = buildSalaryReportHtml(
        makeData({
          report: {
            ...makeData().report,
            result: {
              wageGapDecomposition: {
                oskyrtAvailable: false,
                oskyrtBlockers: ['EMPTY_FEMALE_COHORT'],
                counts: { male: 9, female: 0, excluded: 0 },
              },
            },
          } as unknown as ReportDetailDto,
        }),
      )

      expect(html).toContain('Ekki hægt að reikna')
      expect(html).toContain('Engar konur í skýrslunni')
      expect(html).toContain('9 karlar, 0 konur')
      // Never a figure of zero for a gap that could not be measured.
      expect(html).not.toContain('Undir viðmiði')
    })

    it('surfaces soft warnings alongside a computed figure', () => {
      const html = buildSalaryReportHtml(
        makeData({
          report: {
            ...makeData().report,
            result: {
              wageGapDecomposition: {
                ...makeData().report.result?.wageGapDecomposition,
                warnings: ['NO_SCORE_OVERLAP'],
              },
            },
          } as unknown as ReportDetailDto,
        }),
      )

      expect(html).toContain('Starfsmatsstig kynjanna skarast ekki')
      expect(html).toContain('Undir viðmiði')
    })

    // A frozen snapshot predating these arrays must not fail the whole document
    // — the PDF is attached to the approval email, so a render failure means the
    // company hears nothing.
    it('renders a legacy snapshot missing the blocker and warning arrays', () => {
      expect(() =>
        buildSalaryReportHtml(
          makeData({
            report: {
              ...makeData().report,
              result: {
                wageGapDecomposition: { oskyrtAvailable: false },
              },
            } as unknown as ReportDetailDto,
          }),
        ),
      ).not.toThrow()
    })

    it('omits the block entirely when no result was computed', () => {
      const html = buildSalaryReportHtml(
        makeData({
          report: {
            ...makeData().report,
            result: null,
          } as unknown as ReportDetailDto,
        }),
      )

      expect(html).not.toContain('Sá hluti launamunar sem starfsmatsstig')
    })
  })

  describe('viðmiðunartímabil launagagna', () => {
    it('names the payroll month for a MONTH basis', () => {
      const html = buildSalaryReportHtml(
        makeData({
          report: {
            ...makeData().report,
            salaryDataBasis: SalaryDataBasisEnum.MONTH,
            salaryDataPeriod: '2026-05-01',
          } as unknown as ReportDetailDto,
        }),
      )

      expect(html).toContain('Viðmiðunartímabil launagagna')
      expect(html).toContain('Tiltekinn mánuður — maí 2026')
    })

    it('renders the twelve-month average', () => {
      const html = buildSalaryReportHtml(
        makeData({
          report: {
            ...makeData().report,
            salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
          } as unknown as ReportDetailDto,
        }),
      )

      expect(html).toContain('Tólf mánaða meðaltal')
    })

    // "The company never told us" is itself the answer, so it is stated rather
    // than hidden.
    it('says so outright when the basis was never declared', () => {
      const html = buildSalaryReportHtml(makeData())

      expect(html).toContain('Ekki tilgreint')
    })
  })

  describe('viðbótarlaun og aukagreiðslur', () => {
    const payComponents = {
      male: {
        averageAdditionalSalary: 50000,
        averageBonusSalary: 20000,
        averageTotal: 70000,
        count: 8,
      },
      female: {
        averageAdditionalSalary: 30000,
        averageBonusSalary: 10000,
        averageTotal: 40000,
        count: 6,
      },
      overall: {
        averageAdditionalSalary: 41429,
        averageBonusSalary: 15714,
        averageTotal: 57143,
        count: 14,
      },
      additionalWageGapPercent: 40,
      bonusWageGapPercent: 50,
      totalWageGapPercent: 42.9,
    }

    /**
     * ⚠️ Monthly krónur, not kr./klst. Every other pay figure in the document is
     * a rate, so this block must not borrow `formatHourlyRate`.
     */
    it('renders monthly krónur, never an hourly rate', () => {
      const html = buildSalaryReportHtml(makeData({ payComponents }))

      expect(html).toContain('Viðbótarlaun og aukagreiðslur')
      expect(html).toContain('50.000 kr.')
      expect(html).toContain('70.000 kr.')
      expect(html).not.toContain('50.000 kr./klst.')
      expect(html).toContain('Krónur á mánuði')
    })

    it('signs the per-component gap row', () => {
      const html = buildSalaryReportHtml(makeData({ payComponents }))

      expect(html).toContain('+40,0%')
      expect(html).toContain('+50,0%')
      expect(html).toContain('+42,9%')
    })

    /**
     * ⚠️ `0 kr.` and "nobody to average" are different statements. An absent
     * gender comes back as `0` with `count: 0`, which printed as a real figure
     * would assert something about people who are not there.
     */
    it('dashes a gender with nobody in it rather than printing 0 kr.', () => {
      const html = buildSalaryReportHtml(
        makeData({
          payComponents: {
            ...payComponents,
            female: {
              averageAdditionalSalary: 0,
              averageBonusSalary: 0,
              averageTotal: 0,
              count: 0,
            },
          },
        }),
      )

      expect(html).not.toContain('<td>0 kr.</td>')
    })

    // Three rows of zeros reads as a finding ("nobody gets overtime") rather
    // than as an empty section.
    it('states the empty case instead of tabling zeros', () => {
      const html = buildSalaryReportHtml(
        makeData({
          payComponents: {
            ...payComponents,
            overall: { ...payComponents.overall, averageTotal: 0 },
          },
        }),
      )

      expect(html).toContain('Engar viðbótarlaunagreiðslur skráðar')
      expect(html).not.toContain('Krónur á mánuði')
    })

    it('renders no section at all when the breakdown is absent', () => {
      const html = buildSalaryReportHtml(makeData())

      expect(html).not.toContain('Viðbótarlaun og aukagreiðslur')
    })
  })
})
