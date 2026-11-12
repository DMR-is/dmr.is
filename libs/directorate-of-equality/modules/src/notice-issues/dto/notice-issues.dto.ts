import { IsIn, Matches } from 'class-validator'

import {
  ApiBoolean,
  ApiDateTime,
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStepEnum,
} from '../../mailbox-delivery/models/mailbox-delivery.enums'
import {
  NoticeOutboxKindEnum,
  NoticeOutboxStatusEnum,
} from '../../notice-outbox/models/notice-outbox.enums'

/**
 * What a person can see of a mailbox delivery. `last_error` is deliberately
 * absent: it may hold One's own message, which can echo the recipient's
 * kennitala or name, and must never be shown in a UI unfiltered.
 */
export class NoticeIssueDeliveryDto {
  @ApiUUId()
  id!: string

  @ApiEnum(MailboxDeliveryKindEnum, { enumName: 'MailboxDeliveryKindEnum' })
  kind!: MailboxDeliveryKindEnum

  @ApiString({
    description:
      'PENDING, CASE_CREATED, DOCUMENT_CREATED, SENT, FAILED or UNCERTAIN.',
  })
  status!: string

  @ApiNumber()
  attempts!: number

  @ApiBoolean({ description: 'The attempts are used up.' })
  exhausted!: boolean

  @ApiBoolean({
    description:
      'A call to One may have gone through: UNCERTAIN, or a call interrupted mid-way. Must be reconciled against One before anything is sent again.',
  })
  needsReconciling!: boolean

  @ApiBoolean({
    description: 'A worker holds a live lease and may be calling One now.',
  })
  inProgress!: boolean

  @ApiOptionalEnum(MailboxDeliveryStepEnum, {
    enumName: 'MailboxDeliveryStepEnum',
    nullable: true,
    description:
      'For a delivery that needs reconciling, the call in doubt: CREATE_DOCUMENT (look in One for a document under the case) or SEND_DOC_TO_ISLAND_IS (check whether that document reached the mailbox).',
  })
  uncertainStep!: MailboxDeliveryStepEnum | null

  @ApiOptionalString({
    nullable: true,
    description: "One's case number, to look the case up in One.",
  })
  oneCaseNumber!: string | null

  @ApiOptionalString({
    nullable: true,
    description: "The document's ItemID in One, once filed.",
  })
  oneDocumentItemId!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      "One's ErrorNumber in its loggable form: the code, or a withheld marker.",
  })
  lastErrorNumber!: string | null

  @ApiOptionalDateTime({ nullable: true })
  lastAttemptAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  sentAt!: Date | null
}

export class NoticeIssueDto {
  @ApiUUId()
  id!: string

  @ApiEnum(NoticeOutboxKindEnum, { enumName: 'NoticeOutboxKindEnum' })
  kind!: NoticeOutboxKindEnum

  @ApiEnum(NoticeOutboxStatusEnum, { enumName: 'NoticeOutboxStatusEnum' })
  status!: NoticeOutboxStatusEnum

  @ApiUUId()
  reportId!: string

  @ApiOptionalString({ nullable: true })
  reportIdentifier!: string | null

  @ApiOptionalString({ nullable: true })
  companyName!: string | null

  @ApiNumber()
  attempts!: number

  @ApiOptionalString({
    nullable: true,
    description: "The dispatcher's own reason, which holds nothing personal.",
  })
  lastError!: string | null

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDateTime({
    nullable: true,
    description: 'When it was given up, for a FAILED notice.',
  })
  processedAt!: Date | null

  @ApiOptionalDto(NoticeIssueDeliveryDto, { nullable: true })
  delivery!: NoticeIssueDeliveryDto | null
}

/** A deadline reminder's delivery. It has no outbox row. */
export class ReminderDeliveryIssueDto {
  @ApiDto(NoticeIssueDeliveryDto)
  delivery!: NoticeIssueDeliveryDto

  @ApiUUId()
  companyId!: string

  @ApiOptionalString({ nullable: true })
  companyName!: string | null
}

export class NoticeIssuesDto {
  @ApiDtoArray(NoticeIssueDto, {
    description:
      'Notices given up as FAILED: the company was not told until someone acts.',
  })
  failed!: NoticeIssueDto[]

  @ApiNumber({ description: 'All FAILED notices; `failed` holds at most 100.' })
  failedTotal!: number

  @ApiDtoArray(NoticeIssueDto, {
    description:
      'Notices still PENDING past the overdue limit: held, for the reason in lastError. They go by themselves once the cause is fixed.',
  })
  overdue!: NoticeIssueDto[]

  @ApiNumber({
    description: 'All overdue notices; `overdue` holds at most 100.',
  })
  overdueTotal!: number

  @ApiDtoArray(ReminderDeliveryIssueDto, {
    description:
      'Deadline reminder deliveries that stopped: uncertain, interrupted or out of attempts.',
  })
  reminders!: ReminderDeliveryIssueDto[]

  @ApiNumber({
    description:
      'All stopped reminder deliveries; `reminders` holds at most 100.',
  })
  remindersTotal!: number
}

export const RECONCILE_OUTCOMES = ['SENT', 'NOT_SENT'] as const
export type ReconcileOutcome = (typeof RECONCILE_OUTCOMES)[number]

export class ReconcileDeliveryDto {
  @ApiString({
    enum: RECONCILE_OUTCOMES,
    description:
      'What One shows, checked by a person: SENT, it reached the mailbox; NOT_SENT, it did not.',
  })
  @IsIn(RECONCILE_OUTCOMES)
  outcome!: ReconcileOutcome

  @ApiOptionalString({
    maxLength: 100,
    description:
      "The document's ItemID in One. Required for SENT when the delivery has none; for NOT_SENT, give it when One holds the document unsent, so it is sent rather than filed again.",
  })
  @Matches(/^[A-Za-z0-9._-]+$/)
  documentItemId?: string
}
