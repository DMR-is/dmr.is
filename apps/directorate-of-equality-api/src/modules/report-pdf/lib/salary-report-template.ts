import { CompanySizeEnum } from '../../company/models/company.enums'
import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { PayStatusEnum } from '../../report/lib/wage-gap-decomposition'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { type WageGapDecompositionDto } from '../../report-result/dto/report-result.dto'
import {
  PayDispersionBlockerEnum,
  type PayDispersionDto,
  PayDispersionPopulationEnum,
} from '../../report-statistics/dto/pay-dispersion.dto'
import { SalaryByGenderAndScoreDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import {
  escapeHtml,
  formatDate,
  formatHourlyRate,
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

function salaryAnalysisSection(
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

  return section(
    'Launagreining',
    `<div class="chart-wrap">${chart}</div>
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

  const rows = outliers
    .map(
      (o) =>
        `<tr>
          <td>${o.employeeOrdinal !== null ? `Starfsmaður ${o.employeeOrdinal}` : '—'}</td>
          <td>${orDash(o.roleTitle)}</td>
          <td>${genderLabel(o.gender)}</td>
          <td>${formatHourlyRate(o.regularHourlyWage)}</td>
          <td>${formatHourlyRate(o.expectedHourlyWage)}</td>
          <td>${deviationCell(o)}</td>
          <td>${formatPercent(o.contributionShare)}</td>
        </tr>`,
    )
    .join('')

  return section(
    'Úrbótaáætlun',
    `<table class="data-table">
      <thead><tr><th>Starfsmaður</th><th>Starf</th><th>Kyn</th><th>Tímakaup</th><th>Væntanlegt</th><th>Frávik</th><th>Hlutur af óskýrðu</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
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

  if (employees.length === 0) {
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
      : `<p class="advisory-note">Dæmigerð dreifing um línuna hjá þessu fyrirtæki er ${formatPercent(cohortResidualSpreadPercentDown)} til ${formatPercent(cohortResidualSpreadPercentUp, { signed: true })}. Hér eru starfsmenn sem víkja ${String(payDispersion.threshold).replace('.', ',')} staðalvik eða meira frá henni.</p>`

  const rows = employees
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

  return section(
    'Ábendingar um launadreifingu',
    `<p class="advisory-note">Laun þessara starfsmanna víkja meira frá starfsmatsstigum þeirra en launadreifing fyrirtækisins skýrir.</p>
    <p class="advisory-note--lead">Engra skýringa er krafist og ekkert þarf að skrá — þetta eru ekki frávik í skilningi úrbótaáætlunar og hafa engin áhrif á afgreiðslu skýrslunnar. Ábendingin er til fyrirtækisins sjálfs: gögnin gætu þurft nánari skoðun innanhúss.</p>
    ${spreadNote}
    <table class="data-table">
      <thead><tr><th>Starfsmaður</th><th>Kyn</th><th>Stig</th><th>Tímakaup</th><th>Væntanlegt</th><th>Frávik</th><th>Staðalvik frá línu</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  )
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
  const { report, statistics, outliers } = data
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
    ${salaryAnalysisSection(statistics, report.result?.wageGapDecomposition)}
    ${improvementPlanSection(outliers, report.result?.wageGapDecomposition)}
    ${payDispersionSection(report.result?.payDispersion)}
    ${deadlineSection(report)}
  </body>
</html>`
}
