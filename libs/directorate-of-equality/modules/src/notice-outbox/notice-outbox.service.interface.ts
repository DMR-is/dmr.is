import { NoticeOutboxKindEnum } from './models/notice-outbox.enums'

export interface INoticeOutboxService {
  /**
   * Records that the company is owed `kind` for `reportId`.
   *
   * ⚠️ **Call it inside the transaction of the change that owes the notice.**
   * It joins the ambient CLS transaction, which is the point: the row commits
   * or rolls back with that change.
   *
   * Throws on a second row for the same kind and report. That is an invariant
   * (a report is submitted once and decided once), so a duplicate is a bug to
   * surface, not a case to absorb.
   */
  enqueue(kind: NoticeOutboxKindEnum, reportId: string): Promise<void>
}

export const INoticeOutboxService = Symbol('INoticeOutboxService')
