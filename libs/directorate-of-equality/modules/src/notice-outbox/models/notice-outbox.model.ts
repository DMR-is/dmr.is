import { Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { ReportModel } from '../../report/models/report.model'
import {
  NoticeOutboxChannelEnum,
  NoticeOutboxKindEnum,
  NoticeOutboxStatusEnum,
} from './notice-outbox.enums'

type NoticeOutboxAttributes = {
  kind: NoticeOutboxKindEnum
  reportId: string
  status: NoticeOutboxStatusEnum
  channel: NoticeOutboxChannelEnum | null
  attempts: number
  lastAttemptAt: Date | null
  lastError: string | null
  processedAt: Date | null
}

type NoticeOutboxCreateAttributes = {
  kind: NoticeOutboxKindEnum
  reportId: string
}

/**
 * A notice a company is owed, written in the same transaction as the change
 * that owes it (submit, approve, deny) and sent later by doe-api's dispatcher.
 *
 * The row commits or rolls back with the change, so a notice can neither go
 * out for a change that did not land nor be lost after one that did. That is
 * the durable record `ReportWorkflowService.runAfterCommit` used to lack.
 *
 * With OneSystems on, a row is sent through `mailbox_delivery`, and the two
 * tables split the work: this row records what the report is owed,
 * `mailbox_delivery` how far one send through One got. The delivery is keyed
 * (mailbox kind, filing company, report id), so a retried row resumes the same
 * delivery rather than starting another. A delivery left UNCERTAIN is terminal
 * here, never retried: the row becomes FAILED naming the delivery to check.
 * Company-scoped notices (the deadline reminders) do not use this outbox; they
 * go to `mailbox_delivery` directly, which is why `report_id` is NOT NULL.
 *
 * Ids only. The recipient, the text and the documents are all read from the
 * report when the row is sent, so nothing personal is copied here.
 * `lastError` is written by the dispatcher from its own messages, never from a
 * provider's response.
 *
 * No associations are declared, for the same reason as `MailboxDeliveryModel`
 * (see `src/models.ts`).
 */
@MutableTable({ tableName: DoeModels.NOTICE_OUTBOX })
export class NoticeOutboxModel extends MutableModel<
  NoticeOutboxAttributes,
  NoticeOutboxCreateAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(NoticeOutboxKindEnum)),
    allowNull: false,
  })
  kind!: NoticeOutboxKindEnum

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @Column({
    type: DataType.ENUM(...Object.values(NoticeOutboxStatusEnum)),
    allowNull: false,
    defaultValue: NoticeOutboxStatusEnum.PENDING,
  })
  status!: NoticeOutboxStatusEnum

  /** How it was sent. Null until the row is DONE. */
  @Column({
    type: DataType.ENUM(...Object.values(NoticeOutboxChannelEnum)),
    allowNull: true,
  })
  channel!: NoticeOutboxChannelEnum | null

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  attempts!: number

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_attempt_at' })
  lastAttemptAt!: Date | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'last_error' })
  lastError!: string | null

  /** When the row left PENDING. */
  @Column({ type: DataType.DATE, allowNull: true, field: 'processed_at' })
  processedAt!: Date | null
}
