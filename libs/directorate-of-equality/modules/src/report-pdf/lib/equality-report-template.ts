import { simpleSanitize } from '@dmr.is/utils-server/cleanLegacyHtml'

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
 *
 * ⚠️ **`content` is applicant-supplied HTML and MUST be sanitised here.** Every
 * other value in this document goes through `escapeHtml`/`orDash`; this one is
 * interpolated as markup by design, because it is the rich text the company
 * wrote. Nothing sanitises it on the way in — `ApiHTML` only base64-decodes,
 * and `equality_report_content` is persisted verbatim — so the store already
 * holds whatever was submitted and sanitising at render is what covers the rows
 * written before this.
 *
 * `simpleSanitize` drops `<script>`/`<style>` (tag allow-list) and every event
 * handler (attribute allow-list), which is what stops the submitted plan from
 * executing inside the renderer and from rewriting the Yfirlit metadata of the
 * document being archived. `report-pdf.service.ts` disables JavaScript and
 * blocks network fetches in the page as the second layer; neither is a reason
 * to skip this one.
 */
export function buildEqualityReportHtml(report: ReportDetailDto): string {
  const equality = report.equalityReport
  const companyName = report.company?.name ?? ''
  const content = equality?.content

  const sanitized = content ? simpleSanitize(content) : ''

  /*
   * Gate on the SANITISED text, not the raw `content`. Markup that is entirely
   * disallowed — a bare `<script>` payload, say — sanitises to the empty
   * string, and rendering `<div class="rich-content"></div>` for it produces a
   * document with a silently blank Jafnréttisáætlun section. The empty note is
   * the honest rendering of "nothing to show".
   */
  const body = sanitized
    ? `<div class="rich-content">${sanitized}</div>`
    : `<p class="empty-note">Ekkert efni skráð fyrir jafnréttisáætlun.</p>`

  return `<!DOCTYPE html>
<html lang="is">
  <head>
    <meta charset="utf-8" />
    <title>Jafnréttisáætlun — ${escapeHtml(companyName)}</title>
  </head>
  <body>
    <h1 class="doc-title">Jafnréttisáætlun</h1>
    <p class="doc-intro">${escapeHtml(companyName)} — kennitala ${orDash(
    report.company?.nationalId,
  )}</p>

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
