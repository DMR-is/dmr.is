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
  if (
    report.providerType !== ReportProviderEnum.ISLAND_IS ||
    !report.providerId
  ) {
    return null
  }
  return `https://island.is/umsoknir/jafnrettisstofa/${encodeURIComponent(
    report.providerId,
  )}`
}

/**
 * How the recipient is told to respond, which depends on how the report reached
 * us.
 *
 * This used to be one unconditional sentence — "log in to your application to
 * respond" — with only the *link* conditional. That is wrong for every report
 * that did not come from island.is: the reader is sent to an application that
 * does not exist, with no link to it, and the mail is the only channel they
 * have. It was already wrong for SYSTEM-provider reports (an admin's Excel
 * import) before the partner channel existed.
 *
 * Deliberately no support address or URL: there is no such convention anywhere
 * in these templates, and inventing one would put an address nobody owns in
 * front of employers. The company already has a relationship with
 * Jafnréttisstofa; naming them without a link is honest, and a wrong address
 * would be worse than none.
 */
const responseInstruction = (report: ReportModel): string => {
  if (buildIslandIsApplicationUrl(report)) {
    return 'Vinsamlegast skráðu þig inn á umsókn til að svara.'
  }

  if (report.providerType === ReportProviderEnum.OTHER) {
    return 'Skýrslunni var skilað í gegnum þjónustuaðila fyrirtækisins. Til að svara athugasemdinni þarf að hafa samband við Jafnréttisstofu eða þjónustuaðilann sem skilaði skýrslunni.'
  }

  return 'Til að svara athugasemdinni þarf að hafa samband við Jafnréttisstofu.'
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
    `<p>${responseInstruction(report)}</p>`,
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
    responseInstruction(report),
    ...(applicationUrl ? ['', `Skoða umsókn: ${applicationUrl}`] : []),
  ].join('\n')
}
