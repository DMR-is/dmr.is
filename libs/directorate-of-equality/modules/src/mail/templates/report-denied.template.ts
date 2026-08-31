import { ReportModel } from '../../report/models/report.model'
import { escapeHtml } from './format'
import { reportKindLabel } from './report-labels'

export const buildReportDeniedSubject = (report: ReportModel): string =>
  `${reportKindLabel(report.type)} hafnað`

/**
 * The denial notice. The reviewer's `denialReason` IS the body — there is no
 * generated explanation, because the reviewer already wrote one and a second
 * one alongside it would either repeat or contradict it.
 *
 * ⚠️ **No instruction to reply, and no link.** Unlike the external-comment
 * template, this mail is sent as the review closes: `deny` moves
 * `communicationStatus` to CLOSED, so the thread accepts no further messages
 * and the island.is application is not reopened. Telling the reader to "log in
 * and respond" would point them at a channel the same request just shut. For
 * the same reason there is no support address — see the note in
 * `external-comment.template.ts` on why one is not invented here.
 */
export const buildReportDeniedHtml = (
  report: ReportModel,
  denialReason: string,
): string => {
  const label = reportKindLabel(report.type).toLowerCase()
  const safeReason = escapeHtml(denialReason).replace(/\n/g, '<br/>')

  return [
    `<h2>${escapeHtml(reportKindLabel(report.type))} hafnað</h2>`,
    `<p>Jafnréttisstofa hefur hafnað ${escapeHtml(label)} fyrirtækisins. Ástæðan er eftirfarandi:</p>`,
    '<blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:16px 0;">',
    safeReason,
    '</blockquote>',
  ].join('')
}

export const buildReportDeniedText = (
  report: ReportModel,
  denialReason: string,
): string => {
  const label = reportKindLabel(report.type).toLowerCase()

  return [
    `Jafnréttisstofa hefur hafnað ${label} fyrirtækisins.`,
    '',
    'Ástæða:',
    denialReason,
  ].join('\n')
}
