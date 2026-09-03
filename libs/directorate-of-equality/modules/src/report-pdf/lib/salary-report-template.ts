import { CompanySizeEnum } from '../../company/models/company.enums'
import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import {
  PayStatusEnum,
  WageGapBlockerEnum,
  WageGapWarningEnum,
} from '../../report/lib/wage-gap-decomposition'
import { SalaryDataBasisEnum } from '../../report/models/report.enums'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { type WageGapDecompositionDto } from '../../report-result/dto/report-result.dto'
import {
  type BenefitsBreakdownDto,
  type GenderBenefitsDto,
} from '../../report-statistics/dto/benefits-breakdown.dto'
import {
  PayDispersionBlockerEnum,
  type PayDispersionDto,
  type PayDispersionEmployeeDto,
  PayDispersionPopulationEnum,
} from '../../report-statistics/dto/pay-dispersion.dto'
import { SalaryByGenderAndScoreDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import {
  escapeHtml,
  formatCurrency,
  formatDate,
  formatHourlyRate,
  formatMonthYear,
  formatNumber,
  formatPercent,
  genderLabel,
  orDash,
} from './format'
import { buildSalaryChartSvg } from './salary-chart-svg'

export interface SalaryReportPdfData {
  report: ReportDetailDto
  statistics: SalaryByGenderAndScoreDto
  outliers: ReportEmployeeOutlierDto[]
  /**
   * Viðbótarlaun / aukagreiðslur per gender. Its own fetch rather than part of
   * `statistics` because these are monthly krónur, not rates — the admin screen
   * fetches it separately for the same reason.
   */
  payComponents?: BenefitsBreakdownDto | null
}

const COMPANY_SIZE_LABELS: Record<CompanySizeEnum, string> = {
  [CompanySizeEnum.UNKNOWN]: 'Óþekkt',
  [CompanySizeEnum.SMALL]: '0–24 starfsmenn',
  [CompanySizeEnum.MEDIUM]: '25–49 starfsmenn',
  [CompanySizeEnum.LARGE]: '50+ starfsmenn',
}

function field(label: string, value: string): string {
  return `
    <div>
      <p class="field__label">${label}</p>
      <p class="field__value">${value}</p>
    </div>`
}

function section(title: string, body: string): string {
  return `
    <div class="section">
      <div class="section__header">
        <h2 class="section__title">${title}</h2>
      </div>
      ${body}
    </div>`
}

function companySection(report: ReportDetailDto): string {
  const c = report.company
  return section(
    'Yfirlit',
    `<div class="field-grid">
      ${field('Fyrirtæki', orDash(c.name))}
      ${field('Kennitala', orDash(c.nationalId))}
      ${field('Heimilisfang', orDash(c.address))}
      ${field('Sveitarfélag', orDash([c.postcode, c.city].filter(Boolean).join(', ')))}
      ${field('Stærðarflokkur', COMPANY_SIZE_LABELS[c.employeeCountCategory] ?? orDash(c.employeeCountCategory))}
      ${field('ÍSAT atvinnugreinaflokkur', orDash(c.isatCategory))}
    </div>`,
  )
}

function topManagerSection(report: ReportDetailDto): string {
  return section(
    'Æðsti stjórnandi',
    `<div class="field-grid">
      ${field('Nafn', orDash(report.companyAdminName))}
      ${field('Starfsheiti', orDash(report.companyAdminTitle))}
      ${field('Kyn æðsta stjórnanda', genderLabel(report.companyAdminGender))}
      ${field('Netfang', orDash(report.companyAdminEmail))}
    </div>`,
  )
}

function contactSection(report: ReportDetailDto): string {
  return section(
    'Tengiliður',
    `<div class="field-grid">
      ${field('Nafn', orDash(report.contactName))}
      ${field('Starfsheiti', orDash(report.contactTitle))}
      ${field('Símanúmer', orDash(report.contactPhone))}
      ${field('Netfang', orDash(report.contactEmail))}
    </div>`,
  )
}

function averageEmployeesSection(report: ReportDetailDto): string {
  return section(
    'Meðalfjöldi starfsmanna á ársgrundvelli',
    `<div class="field-grid">
      ${field('Konur', formatNumber(report.averageEmployeeFemaleCount))}
      ${field('Karlar', formatNumber(report.averageEmployeeMaleCount))}
      ${field('Hlutlaus skráning kyns', formatNumber(report.averageEmployeeNeutralCount))}
    </div>`,
  )
}

function subsidiariesSection(report: ReportDetailDto): string {
  if (!report.subsidiaries || report.subsidiaries.length === 0) {
    return section(
      'Dótturfyrirtæki',
      `<p class="empty-note">Engin dótturfyrirtæki skráð.</p>`,
    )
  }

  const rows = report.subsidiaries
    .map(
      (s) =>
        `<tr><td>${orDash(s.name)}</td><td>${orDash(s.nationalId)}</td></tr>`,
    )
    .join('')

  return section(
    'Dótturfyrirtæki',
    `<table class="data-table">
      <thead><tr><th>Nafn</th><th>Kennitala</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  )
}

/**
 * Magnitude + explicit direction, never a signed percentage — the same
 * convention the web uses, so one figure cannot read two ways depending on
 * where it is shown.
 */
function disfavourLabel(
  direction: WageGapDecompositionDto['rawGapDirection'],
): string {
  if (direction === 'FEMALE') return 'í óhag kvenna'
  if (direction === 'MALE') return 'í óhag karla'
  return ''
}

/**
 * Copy for the decomposition's hard blockers and soft warnings.
 *
 * ⚠️ **Mirrors `reportText.salaryTab.blockers` / `.warnings` in the admin web
 * app — change both together.** The API emits enum codes only, so every surface
 * carries its own mapping. The fallback prints the raw code rather than dropping
 * it: an unexplained finding is better than a silently missing one.
 */
const WAGE_GAP_BLOCKER_TEXT: Record<WageGapBlockerEnum, string> = {
  [WageGapBlockerEnum.EMPTY_MALE_COHORT]:
    'Engir karlar í skýrslunni, því er ekki unnt að reikna launamun milli kynja.',
  [WageGapBlockerEnum.EMPTY_FEMALE_COHORT]:
    'Engar konur í skýrslunni, því er ekki unnt að reikna launamun milli kynja.',
}

const WAGE_GAP_WARNING_TEXT: Record<WageGapWarningEnum, string> = {
  [WageGapWarningEnum.ROWS_EXCLUDED_NON_POSITIVE_WAGE]:
    'Starfsmenn með ógilt tímakaup voru undanskildir útreikningi.',
  [WageGapWarningEnum.NO_SCORE_OVERLAP]:
    'Starfsmatsstig kynjanna skarast ekki. Það er raunveruleg niðurstaða — algjör kynjaskipting starfa — en leiðrétta talan byggir þá á framreikningi utan gagnasviðs.',
  [WageGapWarningEnum.NO_SCORE_VARIATION]:
    'Öll starfsmatsstig eru eins, því er ekki unnt að greina hvað stig skýra.',
}

/** What period the submitted figures describe, qualifying every rate above it. */
function salaryDataBasisField(report: ReportDetailDto): string {
  const value =
    report.salaryDataBasis === SalaryDataBasisEnum.MONTH
      ? report.salaryDataPeriod
        ? `Tiltekinn mánuður — ${formatMonthYear(report.salaryDataPeriod)}`
        : 'Tiltekinn mánuður'
      : report.salaryDataBasis === SalaryDataBasisEnum.AVERAGE
        ? 'Tólf mánaða meðaltal'
        : // Older reports predate the declaration. "The company never told us" is
          // itself the answer, so it is stated rather than hidden.
          'Ekki tilgreint'

  return field('Viðmiðunartímabil launagagna', escapeHtml(value))
}

function subsection(title: string, lead: string, body: string): string {
  return `
    <div class="subsection">
      <p class="subsection__title">${title}</p>
      <p class="subsection__lead">${lead}</p>
      ${body}
    </div>`
}

/**
 * **Leiðréttur launamunur** — the compliance figure, and the one thing this
 * document was missing outright.
 *
 * Splits on `oskyrtAvailable`, not on the figure being null: unavailable is a
 * state the engine reports *with reasons*, and those reasons are the actionable
 * half of the message ("you have 0 women, we need at least one"). Same split the
 * admin screen makes.
 *
 * ⚠️ `oskyrtWithinBenchmark !== true`, deliberately, NOT `=== false`. The flag
 * is nullable — a snapshot frozen before it existed reads `null`, and
 * `null === false` is `false`, which would print *Undir viðmiði* over a live
 * gap. Only an explicit `true` may claim compliance. The web card and the
 * auto-review rule fail closed the same way, and this is the surface whose
 * reader cannot ask a follow-up question.
 */
function adjustedGapBlock(decomposition: WageGapDecompositionDto): string {
  if (!decomposition.oskyrtAvailable) {
    // ⚠️ `?? []` and `?? null` throughout, on fields the DTO types as required.
    // These come off a FROZEN snapshot, so a report result computed before a
    // field existed genuinely arrives without it — the same reason
    // `oskyrtWithinBenchmark` is read as `!== true`. Throwing here would fail the
    // whole PDF, and the PDF is now attached to the approval email, so a
    // render failure means the company is told nothing at all.
    const reasons = (decomposition.oskyrtBlockers ?? [])
      .map(
        (code) =>
          `<p class="advisory-note">${escapeHtml(WAGE_GAP_BLOCKER_TEXT[code] ?? code)}</p>`,
      )
      .join('')

    // Counts stay real even when the figures cannot be — this is the actionable
    // half of the message.
    const counts = `<p class="advisory-note">Fjöldi í greiningu: ${formatNumber(
      decomposition.counts?.male ?? null,
    )} karlar, ${formatNumber(decomposition.counts?.female ?? null)} konur.</p>`

    return `<p class="advisory-note advisory-note--lead">Ekki hægt að reikna</p>${reasons}${counts}`
  }

  const exceeded = decomposition.oskyrtWithinBenchmark !== true

  const warnings = (decomposition.warnings ?? [])
    .map(
      (code) =>
        `<p class="advisory-note">${escapeHtml(WAGE_GAP_WARNING_TEXT[code] ?? code)}</p>`,
    )
    .join('')

  return `<div class="stat-cards stat-cards--pair">
      <div class="stat-card stat-card--accent">
        <p class="stat-card__label">Leiðréttur launamunur</p>
        <p class="stat-card__value">${
          decomposition.oskyrtPercent == null
            ? '—'
            : `${formatPercent(decomposition.oskyrtPercent)} ${disfavourLabel(decomposition.oskyrtDirection)}`.trim()
        }</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">Viðmið</p>
        <p class="stat-card__value">${formatPercent(decomposition.benchmarkPercent)} · ${
          exceeded ? 'Yfir viðmiði' : 'Undir viðmiði'
        }</p>
      </div>
    </div>${warnings}`
}

function salaryAnalysisSection(
  report: ReportDetailDto,
  statistics: SalaryByGenderAndScoreDto,
  decomposition?: WageGapDecompositionDto | null,
): string {
  const { totals } = statistics
  // ⚠️ `decomposition?.pooledFit`, NOT `statistics.regressionLine`. See the
  // docblock on buildSalaryChartSvg: regressionLine is a level-space fit nothing
  // else reads, and drawing it here contradicted the úrbótaáætlun table below,
  // which prints figures from the log fit.
  const chart = buildSalaryChartSvg(
    statistics.dataPoints,
    decomposition?.pooledFit,
  )

  /*
   * Two sub-blocks, deliberately apart rather than five cards in a row — the
   * same split the admin screen makes, for the same reason. Óleiðréttur sits
   * with the two averages it is computed from, so a reader can subtract them and
   * arrive at it. Leiðréttur sits alone because it is the figure that decides
   * something, and because the two do NOT nest: leiðréttur can legitimately
   * exceed óleiðréttur when the job-score mix favours the lower-paid group, so
   * placing them adjacent invites a comparison that does not hold.
   */
  const unadjusted = subsection(
    'Meðaltímakaup og hrátt bil',
    'Munur á meðaltímakaupi karla og kvenna, án leiðréttingar. Ekki borið við viðmið.',
    `<div class="field-grid">${salaryDataBasisField(report)}</div>
    <div class="stat-cards">
      <div class="stat-card">
        <p class="stat-card__label">Meðaltímakaup karla</p>
        <p class="stat-card__value">${formatHourlyRate(totals.maleAverageSalary)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">Meðaltímakaup kvenna</p>
        <p class="stat-card__value">${formatHourlyRate(totals.femaleAverageSalary)}</p>
      </div>
      <div class="stat-card stat-card--accent">
        <p class="stat-card__label">Óleiðréttur launamunur</p>
        <p class="stat-card__value">${
          decomposition?.rawGapPercent == null
            ? '—'
            : `${formatPercent(decomposition.rawGapPercent)} ${disfavourLabel(decomposition.rawGapDirection)}`.trim()
        }</p>
      </div>
    </div>`,
  )

  // Absent for a report whose result was never computed. The block then does not
  // render at all, which is honest: there is no figure, not a figure of zero.
  const adjusted = decomposition
    ? subsection(
        'Leiðréttur launamunur',
        'Sá hluti launamunar sem starfsmatsstig skýra ekki. Þetta er talan sem borin er við viðmiðið.',
        adjustedGapBlock(decomposition),
      )
    : ''

  return section(
    'Launagreining',
    `<div class="chart-wrap">${chart}</div>${unadjusted}${adjusted}`,
  )
}

/**
 * **Viðbótarlaun og aukagreiðslur** — monthly krónur, not rates.
 *
 * ⚠️ Every other pay figure in this document is kr./klst. This block is the one
 * that is not, which is why the lead says so and why it formats with
 * `formatCurrency` rather than `formatHourlyRate`. The API returns these raw and
 * deliberately does not divide by greiddar stundir: dividing would double-count
 * the hours already inside the tímakaup figures above.
 *
 * The bottom row is the **óleiðrétti** gap per component — a plain difference of
 * means, no decomposition, no compliance role. It can reach magnitudes like
 * −300% on small denominators, which is not an error, and is exactly why it is
 * kept away from the leiðréttur figure that decides something.
 */
function payComponentsSection(
  payComponents?: BenefitsBreakdownDto | null,
): string {
  if (!payComponents) return ''

  const { male, female, overall } = payComponents

  // Three rows of zeros reads as a finding ("nobody gets overtime") rather than
  // as an empty section.
  if (overall.averageTotal === 0 && overall.count > 0) {
    return section(
      'Viðbótarlaun og aukagreiðslur',
      '<p class="empty-note">Engar viðbótarlaunagreiðslur skráðar</p>',
    )
  }

  /*
   * ⚠️ `0 kr.` and "nobody to average" are different statements. The API
   * averages over a cohort, so an absent gender comes back as `0` with
   * `count: 0` — indistinguishable, once printed, from a cohort that genuinely
   * receives nothing. On a single-gender workforce the whole row would have read
   * as zeros, asserting something about people who are not there.
   */
  const cell = (value: number, count: number): string =>
    count === 0 ? '—' : formatCurrency(value)

  const genderRow = (label: string, row: GenderBenefitsDto): string =>
    `<tr>
      <td>${label}</td>
      <td>${cell(row.averageAdditionalSalary, row.count)}</td>
      <td>${cell(row.averageBonusSalary, row.count)}</td>
      <td>${cell(row.averageTotal, row.count)}</td>
    </tr>`

  return section(
    'Viðbótarlaun og aukagreiðslur',
    `<p class="subsection__lead">Meðaltal viðbótarlauna og aukagreiðslna á mánuði, eftir kyni. Krónur á mánuði — ekki tímakaup, og ekki deilt með greiddum stundum.</p>
    <table class="data-table">
      <thead><tr><th>Kyn</th><th>Viðbótarlaun</th><th>Aukagreiðslur</th><th>Samtals</th></tr></thead>
      <tbody>
        ${genderRow('Karl', male)}
        ${genderRow('Kona', female)}
        ${genderRow('Allir', overall)}
        <tr>
          <td>Óleiðréttur launamunur</td>
          <td>${formatPercent(payComponents.additionalWageGapPercent, { signed: true })}</td>
          <td>${formatPercent(payComponents.bonusWageGapPercent, { signed: true })}</td>
          <td>${formatPercent(payComponents.totalWageGapPercent, { signed: true })}</td>
        </tr>
      </tbody>
    </table>
    <p class="advisory-note">Hlutfallslegur munur á meðaltali karla og kvenna fyrir hvern lið. Ekki leiðrétt fyrir starfsmatsstigum og ekki borið við viðmið.</p>`,
  )
}

/**
 * Úrbótaáætlun — the lágmarksmengi and its explanations.
 *
 * The empty state is a **finding, not an absence**, so the copy says which
 * finding it is. ⚠️ It takes the decomposition for exactly that reason: an empty
 * list does NOT imply compliance and cannot be read as such on the document of
 * record.
 *
 * It used to. While the walk was lift-only it committed its first candidate
 * unconditionally, so an empty set really did mean óskýrt was already under the
 * benchmark. The two-directional walk probes before committing and can decline
 * every candidate — see the four-employee cohort in
 * `wage-gap-decomposition.spec.ts`, óskýrt 4,88% with two carriers and nothing
 * listed. Keying the sentence on `outliers.length` alone would print *engar
 * úrbætur nauðsynlegar* onto the PDF of a company that is over the benchmark,
 * and a PDF is the one surface whose reader cannot ask a follow-up question.
 *
 * Each row carries actual, expected and deviation together. Showing the
 * deviation alone (as this did) invites reading it as the reason the employee is
 * listed — but the reason is the company-wide figure; `Hlutur af óskýrðu` is the
 * column that actually explains the selection.
 */
/**
 * Frávik — the signed deviation plus the direction in words.
 *
 * The sign already carries the direction, but only for a reader who knows the
 * convention. Both admin tables say it outright for the same reason, and the
 * reason applies here hardest: the list can now name someone for being paid
 * ABOVE their starfsmatsstig, which is the opposite of what a reader who
 * remembers the lift-only set expects — and a PDF reader cannot ask.
 */
function deviationCell(
  outlier: Pick<ReportEmployeeOutlierDto, 'deviationPercent' | 'payStatus'>,
): string {
  const percent = formatPercent(outlier.deviationPercent, { signed: true })
  const word =
    outlier.payStatus === PayStatusEnum.UNDERPAID
      ? 'undir'
      : outlier.payStatus === PayStatusEnum.OVERPAID
        ? 'yfir'
        : null

  return word ? `${percent} (${word})` : percent
}

function improvementPlanSection(
  outliers: ReportEmployeeOutlierDto[],
  decomposition?: WageGapDecompositionDto | null,
): string {
  if (!outliers || outliers.length === 0) {
    // Three states, deliberately distinguished. Only an explicit `true` claims
    // compliance; `false` is the newly reachable declined-every-candidate case;
    // null/undefined is a report with no computable gap or no frozen result at
    // all, where the honest answer is that no set was selected — not that none
    // was needed.
    const emptyNote =
      decomposition?.oskyrtWithinBenchmark === true
        ? 'Engar úrbætur nauðsynlegar — óskýrður launamunur er undir viðmiði.'
        : decomposition?.oskyrtWithinBenchmark === false
          ? 'Óskýrður launamunur er yfir viðmiði, en ekki var unnt að setja saman lágmarksmengi: hver einstök leiðrétting hefði fært launamuninn út fyrir viðmiðið í gagnstæða átt. Launamunurinn stendur því eftir og krefst yfirferðar.'
          : 'Ekkert lágmarksmengi var valið, enda liggur óskýrður launamunur ekki fyrir.'

    return section('Úrbótaáætlun', `<p class="empty-note">${emptyNote}</p>`)
  }

  /*
   * ⚠️ **The plan itself is NOT here — it is its own document.** See
   * `improvement-plan-template.ts`.
   *
   * This section used to render every outlier in one flat table. That table had
   * no group name, ástæða, aðgerð or signature, because `fetchAllOutliers` pages
   * `getOutliers` without a `groupId` and flattens every group together — so the
   * document of record showed the Directorate's imposed *Frestur til úrbóta* and
   * none of what the company actually committed to.
   *
   * What stays behind is the count and the pointer. The count because a reader
   * needs to know the plan is non-empty without opening the other file; the
   * pointer because a heading over nothing reads as a finding that failed to
   * print. The EMPTY case above stays in full: an empty lágmarksmengi is a
   * finding, and no separate document is generated for it, so this is the only
   * place it appears.
   *
   * ⚠️ The pointer describes HOW the plan is presented — "í sérstöku skjali" —
   * and deliberately does not claim it is *attached* to whatever carried this
   * report. It cannot: the same sentence has to hold when a reviewer downloads
   * this PDF on its own from the report sidebar, and when the plan render failed
   * and the approval mailed the report alone.
   *
   * ⚠️ It CAN claim the document exists, and that is worth stating because it is
   * not obvious. `generateImprovementPlanPdf` returns null when the report has no
   * outlier groups or when no group has members — neither of which can co-occur
   * with a non-empty `outliers` here. `report_employee_outlier.group_id` is a
   * NOT NULL FK ("Every outlier always belongs to a group" on the model) and
   * `getOutliers` INNER JOINs the group (`required: true`), so an unfiltered page
   * cannot return a groupless row; `report.service.ts:613-615` says as much where
   * it filters. So `outliers.length > 0` implies at least one group with at least
   * one member, which is exactly the condition for a document. Do not weaken this
   * copy on the theory that outliers can exist without a plan — check the FK
   * first.
   */
  return section(
    'Úrbótaáætlun',
    `<p class="field__value">Starfsmenn í úrbótaáætlun: ${formatNumber(outliers.length)}.</p>
    <p class="advisory-note">Úrbótaáætlunin er sett fram í sérstöku skjali, þar sem starfsmenn eru flokkaðir eftir hópum með ástæðu og aðgerðum hvers hóps.</p>`,
  )
}

/**
 * **Ábendingar um launadreifingu** — the informational counterpart to the
 * úrbótaáætlun above, and the one place a company reader is most likely to
 * confuse the two, because on paper they look alike.
 *
 * So the copy leads with what it does NOT ask, and the table drops every column
 * that implies an obligation — no group, no reason, no action, no signature, no
 * `Hlutur af óskýrðu`. A PDF reader cannot ask a follow-up question, so the
 * distinction has to survive on the page alone.
 *
 * ⚠️ **Only the LIST is gated on `ALL_EMPLOYEES`, not the section.** A blocked
 * report explains itself whatever its population — otherwise a company over the
 * benchmark and under the 12-employee floor gets no section and no reason, which
 * is the failure this section was rewritten to prevent. What is withheld is the
 * rows for `EXCLUDING_MINIMUM_SET`, whose framing is not agreed yet.
 *
 * Returning `''` rather than a bare heading is deliberate: a heading over nothing
 * reads as a finding that failed to print.
 */
function payDispersionSection(payDispersion?: PayDispersionDto | null): string {
  if (!payDispersion) return ''
  // ⚠️ Blocker states must survive this gate — see the note on `population` in
  // pay-dispersion.ts. A report that cannot be assessed still explains why; only
  // a PRODUCIBLE list for the not-yet-approved population is skipped.
  if (
    payDispersion.available &&
    payDispersion.population !== PayDispersionPopulationEnum.ALL_EMPLOYEES
  ) {
    return ''
  }

  const {
    available,
    blockers,
    employees,
    cohortResidualSpreadPercentUp,
    cohortResidualSpreadPercentDown,
    countBelowExpected,
    countAboveExpected,
    chanceCriticalSpreads,
  } = payDispersion

  // Three states, and an empty table is only one of them — the same rule the
  // úrbótaáætlun section above had to learn. "Cannot be assessed" and "nothing to
  // report" are different answers and must read differently.
  if (!available) {
    return section(
      'Ábendingar um launadreifingu',
      `<p class="advisory-note">${blockers.map(payDispersionBlockerText).join(' ')}</p>`,
    )
  }

  // ⚠️ On the TRUE counts, NOT on `employees.length`. The array is a shortlist,
  // and a suppressed tie group is the case where employees qualified and no rows
  // were produced — printing the all-clear copy there would state the opposite of
  // what was found, on the document of record.
  if (countBelowExpected === 0 && countAboveExpected === 0) {
    return section(
      'Ábendingar um launadreifingu',
      `<p class="advisory-note">Engar ábendingar — laun engra starfsmanna víkja meira frá starfsmatsstigum sínum en launadreifing fyrirtækisins skýrir.</p>`,
    )
  }

  // ⚠️ Both ends, and no `±`. The spread is symmetric in log points and asymmetric
  // in krónur, so a single figure with a ± in front of it overstates the downward
  // band by 3–5 percentage points — and this is the document of record.
  const spreadNote =
    cohortResidualSpreadPercentUp === null ||
    cohortResidualSpreadPercentDown === null
      ? ''
      // ⚠️ No longer ends "hér eru starfsmenn sem víkja X staðalvik eða meira frá
      // henni". That defined the list by the threshold alone, which stopped being
      // true when the list became the most extreme few per direction. The
      // threshold still appears in `countsNote`, describing the POOL.
      : `<p class="advisory-note">Dæmigerð dreifing um línuna hjá þessu fyrirtæki er ${formatPercent(cohortResidualSpreadPercentDown)} til ${formatPercent(cohortResidualSpreadPercentUp, { signed: true })}.</p>`

  // The POOL the ábendingar were drawn from — a factual statement about who sits
  // past the threshold, NOT a count of ábendingar. Phrased as a noun phrase with a
  // colon rather than "24 starfsmenn víkja …" so it needs no singular/plural
  // agreement at 1 and 21.
  //
  // ⚠️ Must be followed by `listRuleNote`. On its own it invites the reader to add
  // the two figures up and ask where the rest of the rows went.
  const countsNote = `<p class="advisory-note">Starfsmenn sem víkja ${String(payDispersion.threshold).replace('.', ',')} staðalvik eða meira frá línunni: ${formatNumber(countBelowExpected)} niður, ${formatNumber(countAboveExpected)} upp.</p>`

  // ⚠️ The definition. An ábending IS one of the most extreme few per direction —
  // not "an employee past the threshold, of whom some are printed". Unconditional:
  // it is equally true on a company with three below and two above, and making it
  // conditional would let the section's meaning depend on headcount.
  const listRuleNote = `<p class="advisory-note">Ábendingar eru gerðar um þá sem víkja mest í hvora átt.</p>`

  // ⚠️ CONTEXT, not a cut-off, and the copy must not imply otherwise — nothing
  // was filtered on this number. It exists because `|t| ≥ 2` is blind to
  // headcount: screening 10 000 people throws up more extremes than screening
  // 120, and without this line a long list on a large workforce reads as a
  // finding when it may be arithmetic.
  const chanceNote =
    chanceCriticalSpreads === null
      ? ''
      : `<p class="advisory-note">Hjá fyrirtæki af þessari stærð fer sjaldnast nokkur starfsmaður yfir ${formatSpreadMagnitude(chanceCriticalSpreads)} staðalvik frá línunni af tilviljun einni.</p>`

  const below = payDispersionDirection(
    'Undir væntanlegu tímakaupi',
    employees.filter((employee) => employee.studentizedResidual < 0),
  )
  const above = payDispersionDirection(
    'Yfir væntanlegu tímakaupi',
    employees.filter((employee) => employee.studentizedResidual > 0),
  )

  return section(
    'Ábendingar um launadreifingu',
    `<p class="advisory-note">Laun þessara starfsmanna víkja meira frá starfsmatsstigum þeirra en launadreifing fyrirtækisins skýrir.</p>
    <p class="advisory-note--lead">Engra skýringa er krafist og ekkert þarf að skrá — þetta eru ekki frávik í skilningi úrbótaáætlunar og hafa engin áhrif á afgreiðslu skýrslunnar. Ábendingin er til fyrirtækisins sjálfs: gögnin gætu þurft nánari skoðun innanhúss.</p>
    ${spreadNote}
    ${countsNote}
    ${listRuleNote}
    ${chanceNote}
    ${below}
    ${above}`,
  )
}

/**
 * One direction of the ábendingar list — its own heading, its own table.
 *
 * ⚠️ **Two headings, because the two directions are different findings.** An
 * employee paid far BELOW what their stig imply and one paid far above are not
 * variations of one observation, and mixing them buries the first among the
 * second.
 *
 * ⚠️ **No count in the heading, deliberately.** It would only restate the number
 * of rows beneath it. The figures worth stating are the pool — see `countsNote`,
 * which states both directions once rather than splitting them across headings.
 *
 * Returns `''` when a direction has nothing — a heading over an empty table
 * reads as a finding that failed to print.
 */
function payDispersionDirection(
  title: string,
  rows: PayDispersionEmployeeDto[],
): string {
  if (rows.length === 0) return ''

  return subsection(title, '', payDispersionTable(rows))
}

/**
 * ⚠️ Deliberately carries no group, reason, action, signature or `Hlutur af
 * óskýrðu` column. Every one of those implies an obligation the úrbótaáætlun
 * carries and this list does not, and a PDF reader cannot ask which is which.
 */
function payDispersionTable(rows: PayDispersionEmployeeDto[]): string {
  const body = rows
    .map(
      (employee) =>
        `<tr>
          <td>Starfsmaður ${employee.employeeOrdinal}</td>
          <td>${genderLabel(employee.gender)}</td>
          <td>${formatNumber(employee.score)}</td>
          <td>${formatHourlyRate(employee.regularHourlyWage)}</td>
          <td>${formatHourlyRate(employee.expectedHourlyWage)}</td>
          <td>${deviationCell(employee)}</td>
          <td>${formatSpreads(employee.studentizedResidual)}</td>
        </tr>`,
    )
    .join('')

  return `<table class="data-table">
      <thead><tr><th>Starfsmaður</th><th>Kyn</th><th>Stig</th><th>Tímakaup</th><th>Væntanlegt</th><th>Frávik</th><th>Staðalvik frá línu</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`
}

const payDispersionBlockerText = (
  blocker: PayDispersionBlockerEnum,
): string => {
  switch (blocker) {
    case PayDispersionBlockerEnum.COHORT_TOO_SMALL:
      return 'Of fáir starfsmenn til að meta launadreifingu áreiðanlega — það þarf að minnsta kosti 12.'
    case PayDispersionBlockerEnum.NO_SCORE_VARIATION:
      return 'Öll starfsmatsstig eru eins, því liggur ekkert væntanlegt tímakaup fyrir til að víkja frá.'
    case PayDispersionBlockerEnum.GAP_NOT_COMPUTABLE:
      return 'Launadreifing verður ekki metin því ekki var unnt að reikna væntanlegt tímakaup.'
  }
}

/**
 * Spreads, two decimals, Icelandic comma — and deliberately no `%`. This is a
 * count of standard deviations; printing a percent sign would invite comparison
 * with the Frávik column beside it. Mirrors `formatSpreads` in the web's
 * `PayDispersionTable` (change both together).
 */
const formatSpreads = (value: number): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}`

/**
 * The same figure without its sign, for prose that already says the direction in
 * words. "víkja 2,51 staðalvik niður" — printing "−2,51 staðalvik niður" states
 * the direction twice and invites the reader to wonder whether the two disagree.
 */
const formatSpreadMagnitude = (value: number): string =>
  Math.abs(value).toFixed(2).replace('.', ',')

function deadlineSection(report: ReportDetailDto): string {
  return section(
    'Frestur til úrbóta',
    `<p class="field__value">${formatDate(report.correctionDeadline)}</p>`,
  )
}

/**
 * Builds the full salary-report PDF document HTML. Pure — accepts the already
 * fetched report detail, salary statistics and outlier rows.
 */
export function buildSalaryReportHtml(data: SalaryReportPdfData): string {
  const { report, statistics, outliers, payComponents } = data
  const title = `Jafnlaunaúttekt — ${escapeHtml(report.company?.name ?? '')}`

  return `<!DOCTYPE html>
<html lang="is">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body>
    <h1 class="doc-title">Jafnlaunaúttekt</h1>
    <p class="doc-intro">${escapeHtml(report.company?.name ?? '')} — kennitala ${orDash(report.company?.nationalId)}</p>
    ${companySection(report)}
    ${topManagerSection(report)}
    ${contactSection(report)}
    ${averageEmployeesSection(report)}
    ${subsidiariesSection(report)}
    ${salaryAnalysisSection(report, statistics, report.result?.wageGapDecomposition)}
    ${payComponentsSection(payComponents)}
    ${improvementPlanSection(outliers, report.result?.wageGapDecomposition)}
    ${payDispersionSection(report.result?.payDispersion)}
    ${deadlineSection(report)}
  </body>
</html>`
}
