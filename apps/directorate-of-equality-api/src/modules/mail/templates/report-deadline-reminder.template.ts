import { ReportTypeEnum } from '../../report/models/report.enums'

export type ReportDeadlineReminderInput = {
  companyName: string
  reportType: ReportTypeEnum
  /** The deadline being reminded about (6 months out). */
  dueDate: Date
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Icelandic name for each report kind, in the accusative used in the copy. */
const reportLabel = (type: ReportTypeEnum): string =>
  type === ReportTypeEnum.SALARY ? 'jafnlaunaskýrslu' : 'jafnréttisskýrslu'

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

export const buildReportDeadlineReminderSubject = (
  input: ReportDeadlineReminderInput,
): string =>
  `Áminning: skilafrestur ${reportLabel(input.reportType)} er eftir 6 mánuði`

export const buildReportDeadlineReminderHtml = (
  input: ReportDeadlineReminderInput,
): string => {
  const label = reportLabel(input.reportType)
  const due = formatDate(input.dueDate)
  const company = escapeHtml(input.companyName)

  return [
    '<h2>Áminning frá Jafnréttisstofu</h2>',
    `<p>Skilafrestur ${label} fyrir <strong>${company}</strong> er eftir 6 mánuði.</p>`,
    `<p>Skiladagur er <strong>${due}</strong>.</p>`,
    '<p>Vinsamlegast tryggðu að skýrslunni verði skilað tímanlega.</p>',
  ].join('')
}

export const buildReportDeadlineReminderText = (
  input: ReportDeadlineReminderInput,
): string => {
  const label = reportLabel(input.reportType)
  const due = formatDate(input.dueDate)

  return [
    'Áminning frá Jafnréttisstofu.',
    '',
    `Skilafrestur ${label} fyrir ${input.companyName} er eftir 6 mánuði.`,
    `Skiladagur er ${due}.`,
    '',
    'Vinsamlegast tryggðu að skýrslunni verði skilað tímanlega.',
  ].join('\n')
}
