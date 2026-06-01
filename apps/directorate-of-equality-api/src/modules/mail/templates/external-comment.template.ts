import {
  ReportModel,
  ReportProviderEnum,
} from '../../report/models/report.model'
import { ReportCommentModel } from '../../report-comment/models/report-comment.model'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildIslandIsApplicationUrl = (report: ReportModel): string | null => {
  if (report.providerType !== ReportProviderEnum.ISLAND_IS || !report.providerId) {
    return null
  }
  return `https://island.is/umsoknir/jafnrettisstofa/${encodeURIComponent(
    report.providerId,
  )}`
}

export const buildExternalCommentSubject = (report: ReportModel): string =>
  `Ný athugasemd á jafnréttisskýrslu ${report.id}`

export const buildExternalCommentHtml = (
  report: ReportModel,
  comment: ReportCommentModel,
): string => {
  const safeBody = escapeHtml(comment.body).replace(/\n/g, '<br/>')
  const applicationUrl = buildIslandIsApplicationUrl(report)

  return [
    '<h2>Ný athugasemd hefur borist frá Jafnréttisstofu</h2>',
    `<p>Athugasemd hefur verið skráð á jafnréttisskýrslu fyrirtækisins.</p>`,
    '<blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:16px 0;">',
    safeBody,
    '</blockquote>',
    '<p>Vinsamlegast skráðu þig inn á umsókn til að svara.</p>',
    applicationUrl
      ? `<p><a href="${applicationUrl}" target="_blank">Skoða umsókn</a></p>`
      : '',
  ].join('')
}

export const buildExternalCommentText = (
  report: ReportModel,
  comment: ReportCommentModel,
): string => {
  const applicationUrl = buildIslandIsApplicationUrl(report)

  return [
    'Ný athugasemd hefur borist frá Jafnréttisstofu á jafnréttisskýrslu fyrirtækisins.',
    '',
    comment.body,
    '',
    'Vinsamlegast skráðu þig inn á umsókn til að svara.',
    ...(applicationUrl ? ['', `Skoða umsókn: ${applicationUrl}`] : []),
  ].join('\n')
}
