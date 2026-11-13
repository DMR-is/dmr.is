import { MailboxDeliveryKindEnum } from '../mailbox-delivery/models/mailbox-delivery.enums'
import { NoticeOutboxKindEnum } from '../notice-outbox/models/notice-outbox.enums'
import { ReportTypeEnum } from '../report/models/report.model'

/** The mailbox kind of each notice, by report type: each has its own case template. */
export const NOTICE_MAILBOX_KINDS: Record<
  NoticeOutboxKindEnum,
  Record<ReportTypeEnum, MailboxDeliveryKindEnum>
> = {
  [NoticeOutboxKindEnum.REPORT_SUBMITTED]: {
    [ReportTypeEnum.SALARY]: MailboxDeliveryKindEnum.SALARY_REPORT_SUBMITTED,
    [ReportTypeEnum.EQUALITY]:
      MailboxDeliveryKindEnum.EQUALITY_REPORT_SUBMITTED,
  },
  [NoticeOutboxKindEnum.REPORT_APPROVED]: {
    [ReportTypeEnum.SALARY]: MailboxDeliveryKindEnum.SALARY_REPORT_APPROVED,
    [ReportTypeEnum.EQUALITY]: MailboxDeliveryKindEnum.EQUALITY_REPORT_APPROVED,
  },
  [NoticeOutboxKindEnum.REPORT_DENIED]: {
    [ReportTypeEnum.SALARY]: MailboxDeliveryKindEnum.SALARY_REPORT_DENIED,
    [ReportTypeEnum.EQUALITY]: MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED,
  },
}

/**
 * The notice a mailbox kind delivers, or null for a kind with no outbox row
 * (the deadline reminders).
 */
export function noticeKindForMailboxKind(
  kind: MailboxDeliveryKindEnum,
): NoticeOutboxKindEnum | null {
  for (const [noticeKind, byType] of Object.entries(NOTICE_MAILBOX_KINDS)) {
    if (Object.values(byType).includes(kind)) {
      return noticeKind as NoticeOutboxKindEnum
    }
  }
  return null
}
