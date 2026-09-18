import { CompanyReminderTierEnum } from '../../company/models/company-event.model'
import { ReportTypeEnum } from '../../report/models/report.enums'
import { escapeHtml, formatDate } from './format'

export type ReportDeadlineReminderInput = {
  companyName: string
  reportType: ReportTypeEnum
  /** Which milestone this reminder is for. */
  tier: CompanyReminderTierEnum
  /** The deadline being reminded about. */
  dueDate: Date
}

/** Icelandic name for each report kind, in the accusative used in the copy. */
const reportLabel = (type: ReportTypeEnum): string =>
  type === ReportTypeEnum.SALARY ? 'jafnlaunaskýrslu' : 'jafnréttisskýrslu'

/**
 * Lead sentence per tier. The phrasing tracks the tier's band (e.g. the
 * TWO_WEEKS tier only fires when the deadline is genuinely within two weeks),
 * so it stays accurate without hard-coding a single offset.
 */
const TIER_LEAD: Record<CompanyReminderTierEnum, string> = {
  [CompanyReminderTierEnum.SIX_MONTHS]: 'Skilafrestur nálgast — innan sex mánaða.',
  [CompanyReminderTierEnum.TWO_MONTHS]:
    'Skilafrestur nálgast — innan tveggja mánaða.',
  [CompanyReminderTierEnum.TWO_WEEKS]: 'Skilafrestur er innan tveggja vikna.',
  [CompanyReminderTierEnum.DUE]: 'Skiladagur er runninn upp.',
}

const subjectPrefix = (tier: CompanyReminderTierEnum): string =>
  tier === CompanyReminderTierEnum.DUE ? 'Skilafrestur á lokadegi' : 'Áminning'

export const buildReportDeadlineReminderSubject = (
  input: ReportDeadlineReminderInput,
): string =>
  `${subjectPrefix(input.tier)}: skilafrestur ${reportLabel(input.reportType)} — skiladagur ${formatDate(input.dueDate)}`

export const buildReportDeadlineReminderHtml = (
  input: ReportDeadlineReminderInput,
): string => {
  const label = reportLabel(input.reportType)
  const due = formatDate(input.dueDate)
  const company = escapeHtml(input.companyName)

  return [
    '<h2>Áminning frá Jafnréttisstofu</h2>',
    `<p>${escapeHtml(TIER_LEAD[input.tier])}</p>`,
    `<p>Skiladagur ${label} fyrir <strong>${company}</strong> er <strong>${due}</strong>.</p>`,
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
    TIER_LEAD[input.tier],
    `Skiladagur ${label} fyrir ${input.companyName} er ${due}.`,
    '',
    'Vinsamlegast tryggðu að skýrslunni verði skilað tímanlega.',
  ].join('\n')
}
