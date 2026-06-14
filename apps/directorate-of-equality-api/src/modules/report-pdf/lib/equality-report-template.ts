import { ReportDetailDto } from '../../report/dto/report-detail.dto'
import { escapeHtml, formatDate, orDash } from './format'

function field(label: string, value: string): string {
  return `
    <div>
      <p class="field__label">${label}</p>
      <p class="field__value">${value}</p>
    </div>`
}

/**
 * Builds the equality-report PDF document HTML. Simpler than the salary
 * report: the body is the equality report's rich-text `content` (already HTML),
 * preceded by company identification and approval/validity metadata.
 */
export function buildEqualityReportHtml(report: ReportDetailDto): string {
  const equality = report.equalityReport
  const companyName = report.company?.name ?? ''
  const content = equality?.content

  const body = content
    ? `<div class="rich-content">${content}</div>`
    : `<p class="empty-note">Ekkert efni skráð fyrir jafnréttisáætlun.</p>`

  return `<!DOCTYPE html>
<html lang="is">
  <head>
    <meta charset="utf-8" />
    <title>Jafnréttisáætlun — ${escapeHtml(companyName)}</title>
  </head>
  <body>
    <h1 class="doc-title">Jafnréttisáætlun</h1>
    <p class="doc-intro">${escapeHtml(companyName)} — kennitala ${orDash(report.company?.nationalId)}</p>

    <div class="section">
      <div class="section__header">
        <h2 class="section__title">Yfirlit</h2>
      </div>
      <div class="field-grid">
        ${field('Auðkenni', orDash(equality?.identifier))}
        ${field('Samþykkt', formatDate(equality?.approvedAt))}
        ${field('Gildir til', formatDate(equality?.validUntil))}
        ${field('Frestur til úrbóta', formatDate(equality?.correctionDeadline))}
      </div>
    </div>

    <div class="section">
      <div class="section__header">
        <h2 class="section__title">Jafnréttisáætlun</h2>
      </div>
      ${body}
    </div>
  </body>
</html>`
}
