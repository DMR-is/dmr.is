import {
  CommunicationStatusTranslatedEnum,
  ReportStatusTranslatedEnum,
} from '../../lib/constants'
import { sharedText } from '../../lib/text'

export type ReportFilterOption = { value: string; label: string }

/**
 * The two things a company files. The whole taxonomy — the retired
 * vottun/staðfesting split is not part of it, and `IMPROVEMENT_PLAN` (which
 * the vinnslusvæði filter offers as a third pseudo-type mapping to
 * `hasImprovementPlan`) is deliberately absent here: an úrbótaáætlun is a
 * state OF a skýrslugjöf, not a kind of filing, and the export carries it as
 * its own column instead.
 */
export const REPORT_TYPE_OPTIONS: ReportFilterOption[] = [
  { value: 'EQUALITY', label: sharedText.typeLabels.EQUALITY },
  { value: 'SALARY', label: sharedText.typeLabels.SALARY },
]

/**
 * Report statuses, in workflow order.
 *
 * DRAFT is absent on purpose and cannot be added: a draft belongs to the
 * applicant and the server filters it out of the requested set even when a
 * status filter names it. Offering it would be a control that silently does
 * nothing. WITHDRAWN is offered — it is hidden by default but can be asked for.
 */
export const REPORT_STATUS_OPTIONS: ReportFilterOption[] = [
  { value: 'SUBMITTED', label: ReportStatusTranslatedEnum.SUBMITTED },
  { value: 'IN_REVIEW', label: ReportStatusTranslatedEnum.IN_REVIEW },
  { value: 'POSTPONED', label: ReportStatusTranslatedEnum.POSTPONED },
  { value: 'APPROVED', label: ReportStatusTranslatedEnum.APPROVED },
  { value: 'DENIED', label: ReportStatusTranslatedEnum.DENIED },
  { value: 'SUPERSEDED', label: ReportStatusTranslatedEnum.SUPERSEDED },
  { value: 'WITHDRAWN', label: ReportStatusTranslatedEnum.WITHDRAWN },
]

export const COMMUNICATION_STATUS_OPTIONS: ReportFilterOption[] = [
  {
    value: 'NOT_STARTED',
    label: CommunicationStatusTranslatedEnum.NOT_STARTED,
  },
  {
    value: 'AWAITING_RESPONSE',
    label: CommunicationStatusTranslatedEnum.AWAITING_RESPONSE,
  },
  {
    value: 'RESPONSE_RECEIVED',
    label: CommunicationStatusTranslatedEnum.RESPONSE_RECEIVED,
  },
  { value: 'CLOSED', label: CommunicationStatusTranslatedEnum.CLOSED },
]

/**
 * Where the jafnréttisáætlun behind a report came from. LEGACY means an
 * unexpired certification carried over from the retired register rather than a
 * plan filed here — worth being able to count, because that cohort shrinks
 * every year and the figures change as it does.
 */
export const EQUALITY_SOURCE_OPTIONS: ReportFilterOption[] = [
  { value: 'REPORT', label: 'Skráð í þessu kerfi' },
  { value: 'LEGACY', label: 'Úr eldra kerfi' },
]
