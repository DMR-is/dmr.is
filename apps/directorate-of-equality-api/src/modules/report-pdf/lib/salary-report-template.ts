import { CompanySizeEnum } from '../../company/models/company.enums'
import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { SalaryByGenderAndScoreDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import {
  escapeHtml,
  formatDate,
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

function salaryAnalysisSection(statistics: SalaryByGenderAndScoreDto): string {
  const { totals } = statistics
  const chart = buildSalaryChartSvg(
    statistics.dataPoints,
    statistics.regressionLine,
  )

  return section(
    'Launagreining',
    `<div class="chart-wrap">${chart}</div>
    <div class="stat-cards">
      <div class="stat-card">
        <p class="stat-card__label">Meðallaun karla</p>
        <p class="stat-card__value">${formatNumber(totals.maleAverageSalary)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">Meðallaun kvenna</p>
        <p class="stat-card__value">${formatNumber(totals.femaleAverageSalary)}</p>
      </div>
      <div class="stat-card stat-card--accent">
        <p class="stat-card__label">Launamunur</p>
        <p class="stat-card__value">${formatPercent(totals.wageGapPercent, { signed: true })}</p>
      </div>
    </div>`,
  )
}

function improvementPlanSection(
  outliers: ReportEmployeeOutlierDto[],
): string {
  if (!outliers || outliers.length === 0) {
    return section(
      'Úrbótaáætlun',
      `<p class="empty-note">Engin frávik skráð.</p>`,
    )
  }

  const rows = outliers
    .map(
      (o) =>
        `<tr>
          <td>${o.employeeOrdinal !== null ? `Starfsmaður ${o.employeeOrdinal}` : '—'}</td>
          <td>${orDash(o.roleTitle)}</td>
          <td>${genderLabel(o.gender)}</td>
          <td>${formatPercent(o.differencePercent, { signed: true })}</td>
        </tr>`,
    )
    .join('')

  return section(
    'Úrbótaáætlun',
    `<table class="data-table">
      <thead><tr><th>Starfsmaður</th><th>Starf</th><th>Kyn</th><th>Launafrávik</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  )
}

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
    ${salaryAnalysisSection(statistics)}
    ${improvementPlanSection(outliers)}
    ${deadlineSection(report)}
  </body>
</html>`
}
