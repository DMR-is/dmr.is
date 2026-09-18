import { ReportModel } from '../../report/models/report.model'
import { escapeHtml, formatDate } from './format'
import { reportKindLabel } from './report-labels'

export const buildReportApprovedSubject = (report: ReportModel): string =>
  `${reportKindLabel(report.type)} samþykkt`

/**
 * Names the attached documents in the body.
 *
 * A salary approval carries two PDFs — the report and the úrbótaáætlun, which is
 * its own document — and an unnamed second attachment reads as a duplicate of
 * the first.
 */
const attachmentLine = (labels: string[]): string =>
  labels.length === 0
    ? ''
    : labels.length === 1
      ? `Skjalið er í viðhengi: ${labels[0]}.`
      : `Skjölin eru í viðhengi: ${labels.join(', ')}.`

/**
 * The approval notice — a covering note, not the report.
 *
 * The report itself travels as the attached PDF, so the body's whole job is to
 * say what was approved, how long it holds and what is attached.
 *
 * `validUntil` is set by `approve` in the same request, so it is present in
 * practice; `formatDate` renders an em dash rather than `Invalid Date` if a
 * caller passes a report projection that omitted it.
 */
export const buildReportApprovedHtml = (
  report: ReportModel,
  attachmentLabels: string[],
): string => {
  const kind = reportKindLabel(report.type)
  const attachments = attachmentLine(attachmentLabels)

  return [
    `<h2>${escapeHtml(kind)} samþykkt</h2>`,
    `<p>Jafnréttisstofa hefur samþykkt ${escapeHtml(kind.toLowerCase())} fyrirtækisins.</p>`,
    `<p>Samþykktin gildir til ${formatDate(report.validUntil)}.</p>`,
    attachments ? `<p>${escapeHtml(attachments)}</p>` : '',
  ].join('')
}

export const buildReportApprovedText = (
  report: ReportModel,
  attachmentLabels: string[],
): string => {
  const kind = reportKindLabel(report.type)
  const attachments = attachmentLine(attachmentLabels)

  return [
    `Jafnréttisstofa hefur samþykkt ${kind.toLowerCase()} fyrirtækisins.`,
    '',
    `Samþykktin gildir til ${formatDate(report.validUntil)}.`,
    ...(attachments ? ['', attachments] : []),
  ].join('\n')
}
