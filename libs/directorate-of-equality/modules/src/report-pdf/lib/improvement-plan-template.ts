import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { PayStatusEnum } from '../../report/lib/wage-gap-decomposition'
import { ReportEmployeeOutlierDto } from '../../report-employee/dto/report-employee-outlier.dto'
import { ReportOutlierGroupDto } from '../../report-employee/dto/report-outlier-group.dto'
import {
  escapeHtml,
  formatDate,
  formatHourlyRate,
  formatNumber,
  formatPercent,
  genderLabel,
  orDash,
} from './format'

/** One group with the outliers assigned to it, in the order the API returned. */
export interface ImprovementPlanGroup {
  group: ReportOutlierGroupDto
  members: ReportEmployeeOutlierDto[]
}

export interface ImprovementPlanPdfData {
  report: ReportDetailDto
  groups: ImprovementPlanGroup[]
}

/**
 * Frávik — the signed deviation plus the direction in words.
 *
 * ⚠️ Duplicated from `salary-report-template.ts` deliberately rather than
 * shared: these are two documents that happen to agree today, and the salary
 * report's copy is about a flat list while this one sits under a group heading.
 * If they must move together, move them together — but a shared helper would
 * imply they must, which is not established.
 *
 * The sign already carries the direction, but only for a reader who knows the
 * convention, and this list can name someone for being paid ABOVE their
 * starfsmatsstig — the opposite of what a reader who remembers the lift-only set
 * expects. A PDF reader cannot ask.
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

function memberTable(members: ReportEmployeeOutlierDto[]): string {
  if (members.length === 0) {
    // A group with no members is a data fault, not an empty state — every group
    // exists because outliers were assigned to it. Say so rather than printing
    // an empty table, which reads as "nobody needs correcting".
    return '<p class="empty-note">Engir starfsmenn skráðir í þennan hóp.</p>'
  }

  const rows = members
    .map(
      (m) =>
        `<tr>
          <td>${m.employeeOrdinal !== null ? `Starfsmaður ${m.employeeOrdinal}` : '—'}</td>
          <td>${orDash(m.roleTitle)}</td>
          <td>${genderLabel(m.gender)}</td>
          <td>${formatNumber(m.score)}</td>
          <td>${formatHourlyRate(m.regularHourlyWage)}</td>
          <td>${formatHourlyRate(m.expectedHourlyWage)}</td>
          <td>${deviationCell(m)}</td>
          <td>${formatPercent(m.contributionShare)}</td>
        </tr>`,
    )
    .join('')

  return `<table class="data-table">
      <thead><tr><th>Starfsmaður</th><th>Starf</th><th>Kyn</th><th>Stig</th><th>Tímakaup</th><th>Væntanlegt tímakaup</th><th>Launafrávik</th><th>Hlutur af óskýrðu</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

function labelledRow(label: string, value: string): string {
  return `
    <tr>
      <th class="detail-table__label">${label}</th>
      <td>${value}</td>
    </tr>`
}

/**
 * The group's explanation — what the company committed to.
 *
 * `reason` and the rest are all-NULL or all-populated, enforced in the database
 * by `report_outlier_group_explanation_chk`: a postponed group has not been
 * asked yet. So one check on `reason` decides the whole block, and the postponed
 * case says which state it is in rather than printing four empty rows.
 */
function explanationTable(group: ReportOutlierGroupDto): string {
  if (!group.reason) {
    return '<p class="empty-note">Skýring liggur ekki fyrir — frestur var veittur á úrbótaáætlun þessa hóps.</p>'
  }

  return `<table class="data-table detail-table">
      <tbody>
        ${labelledRow('Ástæða', orDash(group.reason))}
        ${labelledRow('Aðgerð', orDash(group.action))}
        ${labelledRow('Nafn undirritanda', orDash(group.signatureName))}
        ${labelledRow('Hlutverk undirritanda', orDash(group.signatureRole))}
      </tbody>
    </table>`
}

function groupSection(entry: ImprovementPlanGroup): string {
  return `
    <div class="section">
      <div class="section__header">
        <h2 class="section__title">${orDash(entry.group.name)}</h2>
      </div>
      ${memberTable(entry.members)}
      ${explanationTable(entry.group)}
    </div>`
}

/**
 * Builds the úrbótaáætlun as its own document.
 *
 * Its own document, and not a section of the salary report, because it is a
 * different kind of statement: the report is what the Directorate assessed, this
 * is what the company committed to. Filing them together buried the commitment —
 * and the salary report's version could not show it at all, since it paged
 * `getOutliers` without a `groupId` and flattened every group into one table,
 * losing the group name, ástæða, aðgerð and signature along the way.
 *
 * Pure — takes the already-fetched groups and their members.
 */
export function buildImprovementPlanHtml(
  data: ImprovementPlanPdfData,
): string {
  const { report, groups } = data
  const companyName = report.company?.name ?? ''

  const body =
    groups.length === 0
      ? '<p class="empty-note">Engir hópar skráðir í úrbótaáætlun.</p>'
      : groups.map(groupSection).join('')

  return `<!DOCTYPE html>
<html lang="is">
  <head>
    <meta charset="utf-8" />
    <title>Úrbótaáætlun — ${escapeHtml(companyName)}</title>
  </head>
  <body>
    <h1 class="doc-title">Úrbótaáætlun</h1>
    <p class="doc-intro">${escapeHtml(companyName)} — kennitala ${orDash(report.company?.nationalId)}</p>

    <div class="section">
      <div class="section__header">
        <h2 class="section__title">Yfirlit</h2>
      </div>
      <div class="field-grid">
        <div>
          <p class="field__label">Auðkenni skýrslu</p>
          <p class="field__value">${orDash(report.identifier)}</p>
        </div>
        <div>
          <p class="field__label">Frestur til úrbóta</p>
          <p class="field__value">${formatDate(report.correctionDeadline)}</p>
        </div>
      </div>
      <p class="advisory-note">Starfsmenn í lágmarksmengi, flokkaðir eftir þeim hópum sem fyrirtækið skilgreindi, með ástæðu og aðgerðum hvers hóps.</p>
    </div>

    ${body}
  </body>
</html>`
}
