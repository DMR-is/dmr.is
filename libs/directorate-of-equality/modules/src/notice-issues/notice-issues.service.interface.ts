import {
  NoticeIssuesDto,
  OneSystemsCheckDto,
  RecentDeliveryDto,
  ReconcileDeliveryDto,
} from './dto/notice-issues.dto'

/** Who acted, for the audit note left on the row. Name and id, never a kennitala. */
export type NoticeIssueActor = { id: string; name: string }

/**
 * The admin view of notices that did not reach the company, and the two acts
 * a person takes on them. Each act does what the documented recovery SQL does
 * (mailbox-delivery README: "Exhausted rows", "Reconciling an UNCERTAIN row";
 * doe-api `db/README.md`: "Re-driving a FAILED row"), so nobody needs to run
 * it by hand, and leaves who did it in the delivery's `last_error`.
 */
export interface INoticeIssuesService {
  /** Failed and overdue notices, and stopped reminder deliveries. Reads only. */
  getIssues(): Promise<NoticeIssuesDto>

  /** The latest letters that reached a mailbox, newest first. Reads only. */
  getRecentDeliveries(): Promise<RecentDeliveryDto[]>

  /** A fresh Login to One, sending nothing else. */
  checkOneSystems(actor: NoticeIssueActor): Promise<OneSystemsCheckDto>

  /**
   * Sends a FAILED notice again. Its mailbox delivery, if any, is re-armed
   * when it ran out of attempts. Refused while that delivery may already have
   * reached One (reconcile it first) or is mid-call.
   */
  retryNotice(noticeId: string, actor: NoticeIssueActor): Promise<void>

  /**
   * Settles a delivery that may have reached One, after a person checked One:
   * SENT records it as sent, NOT_SENT lets it go again (from the document,
   * when its ItemID is known). A FAILED notice it belongs to is then sent
   * again; a SENT one is recorded DONE without a second letter.
   */
  reconcileDelivery(
    deliveryId: string,
    dto: ReconcileDeliveryDto,
    actor: NoticeIssueActor,
  ): Promise<void>
}

export const INoticeIssuesService = Symbol('INoticeIssuesService')
