import { ReportTypeEnum } from '../models/report.enums'

const REPORT_TYPE_PHRASE: Record<ReportTypeEnum, string> = {
  [ReportTypeEnum.EQUALITY]: 'an equality report',
  [ReportTypeEnum.SALARY]: 'a salary report',
}

/**
 * 409 messages for a providerId already taken.
 *
 * They name neither the providerId nor its channel. The stored form is
 * namespaced per channel (`<kennitala>:<id>` on the partner API), which a
 * caller never sees and should not learn from an error; the caller already
 * knows which id it sent. Callers log the stored tuple instead.
 */
export const providerIdConflictMessages = {
  otherCompany: 'This providerId is already used by a different company',
  otherType: (type: ReportTypeEnum): string =>
    `This providerId is already used for ${REPORT_TYPE_PHRASE[type]}`,
}
