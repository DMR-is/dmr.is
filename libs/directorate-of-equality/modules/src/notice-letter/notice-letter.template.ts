import { escapeHtml, formatDate } from '../mail/templates/format'
import {
  buildReportApprovedHtml,
  buildReportApprovedSubject,
} from '../mail/templates/report-approved.template'
import {
  buildReportDeniedHtml,
  buildReportDeniedSubject,
} from '../mail/templates/report-denied.template'
import { reportKindLabel } from '../mail/templates/report-labels'
import { ReportModel } from '../report/models/report.model'

/**
 * The letters a company receives in its island.is mailbox, one PDF each.
 *
 * The approved and denied letters carry the same text as their emails: the
 * body is the email's own HTML, so the two channels cannot drift. The
 * submission receipt has no email to copy.
 *
 * TODO(Jafnréttisstofa): Úlfhildur to confirm the letter text, the receipt's
 * in particular.
 */
export type NoticeLetter = {
  /** The document's title in One and in the mailbox. */
  subject: string
  /** A complete HTML document for `IPdfRenderService.renderHtml`. */
  html: string
}

type LetterReport = Pick<ReportModel, 'type' | 'validUntil'>

export const buildSubmittedLetter = (
  report: Pick<ReportModel, 'type'>,
  companyName: string,
  receivedAt: Date,
): NoticeLetter => {
  const kind = reportKindLabel(report.type)
  const subject = `${kind} móttekin`

  return {
    subject,
    html: letterDocument({
      subject,
      companyName,
      date: receivedAt,
      body: [
        `<h2>${escapeHtml(subject)}</h2>`,
        `<p>Jafnréttisstofu barst ${escapeHtml(
          kind.toLowerCase(),
        )} fyrirtækisins ${formatDate(receivedAt)}.</p>`,
        '<p>Fyrirtækinu verður tilkynnt um niðurstöðu yfirferðar.</p>',
      ].join(''),
    }),
  }
}

/**
 * `enclosures` names the documents merged in after the letter. The email's
 * "Skjalið er í viðhengi" line is left out: in the mailbox they are pages of
 * the same PDF, not attachments.
 */
export const buildApprovedLetter = (
  report: LetterReport,
  companyName: string,
  approvedAt: Date,
  enclosures: string[],
): NoticeLetter => {
  const subject = buildReportApprovedSubject(report)

  return {
    subject,
    html: letterDocument({
      subject,
      companyName,
      date: approvedAt,
      body: buildReportApprovedHtml(report, []),
      enclosures,
    }),
  }
}

export const buildDeniedLetter = (
  report: Pick<ReportModel, 'type'>,
  companyName: string,
  deniedAt: Date,
  denialReason: string,
): NoticeLetter => {
  const subject = buildReportDeniedSubject(report)

  return {
    subject,
    html: letterDocument({
      subject,
      companyName,
      date: deniedAt,
      body: buildReportDeniedHtml(report, denialReason),
    }),
  }
}

/** `body` is trusted HTML: every interpolated value in it is escaped already. */
const letterDocument = ({
  subject,
  companyName,
  date,
  body,
  enclosures = [],
}: {
  subject: string
  companyName: string
  date: Date
  body: string
  enclosures?: string[]
}): string =>
  [
    '<!DOCTYPE html>',
    '<html lang="is">',
    '<head>',
    '<meta charset="utf-8" />',
    `<title>${escapeHtml(subject)}</title>`,
    '</head>',
    '<body>',
    '<p class="letter__sender">Jafnréttisstofa</p>',
    `<p class="letter__date">${formatDate(date)}</p>`,
    `<p class="letter__recipient">${escapeHtml(companyName)}</p>`,
    `<div class="letter__body">${body}</div>`,
    enclosures.length > 0
      ? `<p class="letter__enclosures">Fylgiskjöl: ${escapeHtml(
          enclosures.join(', '),
        )}.</p>`
      : '',
    '</body>',
    '</html>',
  ].join('')

/** Print styles for a notice letter. A4, matching the report PDFs' type. */
export const noticeLetterStyles = `
  @page {
    size: A4;
    margin: 24mm 18mm;
  }

  body {
    font-family: -apple-system, 'IBM Plex Sans', Arial, sans-serif;
    color: #00003c;
    font-size: 12px;
    line-height: 1.6;
    margin: 0;
  }

  .letter__sender {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 24px 0;
  }

  .letter__date {
    margin: 0 0 4px 0;
  }

  .letter__recipient {
    margin: 0 0 32px 0;
  }

  .letter__body h2 {
    font-size: 18px;
    margin: 0 0 16px 0;
  }

  .letter__enclosures {
    margin-top: 32px;
    color: #5a5a72;
  }
`
