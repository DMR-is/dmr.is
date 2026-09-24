import { Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { CompanyModel } from '../../company/models/company.model'
import { DoeModels } from '../../constants'
import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStepEnum,
} from './mailbox-delivery.enums'

type MailboxDeliveryAttributes = {
  companyId: string
  nationalId: string
  kind: MailboxDeliveryKindEnum
  idempotencyKey: string
  subject: string
  status: MailboxDeliveryStatusEnum
  inFlightStep: MailboxDeliveryStepEnum | null
  oneCaseNumber: string | null
  oneCaseItemId: string | null
  oneDocumentItemId: string | null
  islandIsDocumentId: string | null
  pdfSha256: string | null
  pdfSizeBytes: number | null
  attempts: number
  lastAttemptAt: Date | null
  lastError: string | null
  lastErrorNumber: string | null
  leaseToken: string | null
  leaseExpiresAt: Date | null
  sentAt: Date | null
}

type MailboxDeliveryCreateAttributes = {
  companyId: string
  nationalId: string
  kind: MailboxDeliveryKindEnum
  idempotencyKey: string
  subject: string
  status?: MailboxDeliveryStatusEnum
}

/**
 * One notice on its way to a company's island.is Stafrænt pósthólf through
 * Jafnréttisstofa's case system, One: CreateCase, then CreateDocument, then
 * SendDocToIslandIs.
 *
 * Each id One returns is saved as soon as it arrives and never overwritten,
 * and a resume skips every step whose result is already saved (for the send:
 * `sentAt`). That is what makes a retry safe for the two calls that are not
 * idempotent. `status` is the summary for humans and queues. The CHECK
 * constraints stop a forward status from getting ahead of its ids, and the
 * saved ids decide what runs next.
 *
 * `nationalId` is the recipient's kennitala as sent to One, which makes it the
 * mailbox the notice lands in. A composite foreign key to
 * `company(id, national_id)` pins it to `companyId`.
 *
 * The PDF itself is not stored. One keeps the bytes; this row keeps
 * `pdfSha256` (lowercase hex) and `pdfSizeBytes`.
 *
 * `leaseToken`/`leaseExpiresAt` are a worker's claim on the row, taken with a
 * conditional UPDATE rather than a row lock so no connection is held across the
 * calls to One. Both are set together or both are null.
 *
 * No associations are declared. `@ForeignKey` is enough for the column, and
 * leaving out `@BelongsTo` keeps this model out of the model import cycle (see
 * `src/models.ts`).
 */
@MutableTable({ tableName: DoeModels.MAILBOX_DELIVERY })
export class MailboxDeliveryModel extends MutableModel<
  MailboxDeliveryAttributes,
  MailboxDeliveryCreateAttributes
> {
  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({
    type: DataType.ENUM(...Object.values(MailboxDeliveryKindEnum)),
    allowNull: false,
  })
  kind!: MailboxDeliveryKindEnum

  /** Chosen by the caller. A repeat call with the same key resumes this row. */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
    field: 'idempotency_key',
  })
  idempotencyKey!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  subject!: string

  @Column({
    type: DataType.ENUM(...Object.values(MailboxDeliveryStatusEnum)),
    allowNull: false,
    defaultValue: MailboxDeliveryStatusEnum.PENDING,
  })
  status!: MailboxDeliveryStatusEnum

  /**
   * The non-idempotent call in progress. If it is still set when the row is
   * next claimed, the process died mid-call and the row becomes UNCERTAIN.
   */
  @Column({
    type: DataType.ENUM(...Object.values(MailboxDeliveryStepEnum)),
    allowNull: true,
    field: 'in_flight_step',
  })
  inFlightStep!: MailboxDeliveryStepEnum | null

  /** CreateCase's `CaseNumber`: the human-facing case number in One. */
  @Column({ type: DataType.TEXT, allowNull: true, field: 'one_case_number' })
  oneCaseNumber!: string | null

  /** CreateCase's `ItemID`: the case CreateDocument files under. */
  @Column({ type: DataType.TEXT, allowNull: true, field: 'one_case_item_id' })
  oneCaseItemId!: string | null

  /** CreateDocument's `ItemID`: the document SendDocToIslandIs sends. */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'one_document_item_id',
  })
  oneDocumentItemId!: string | null

  /**
   * SendDocToIslandIs's `ItemID`. The spec does not say what it identifies;
   * taken to be the delivered mailbox document until OneSystems confirms.
   * NULL on a SENT row when One confirmed the send without one, so "sent" is
   * `sentAt`, never this column.
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'island_is_document_id',
  })
  islandIsDocumentId!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'pdf_sha256' })
  pdfSha256!: string | null

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'pdf_size_bytes' })
  pdfSizeBytes!: number | null

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  attempts!: number

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_attempt_at' })
  lastAttemptAt!: Date | null

  /** One's `ErrorMessage`, or the transport error. Never a token or password. */
  @Column({ type: DataType.TEXT, allowNull: true, field: 'last_error' })
  lastError!: string | null

  /**
   * One's `ErrorNumber` from the most recent failure, as
   * `toLoggableErrorNumber` returns it: the code, or a withheld marker when it
   * is not code-shaped or could hold a kennitala. Never the raw value.
   */
  @Column({ type: DataType.TEXT, allowNull: true, field: 'last_error_number' })
  lastErrorNumber!: string | null

  @Column({ type: DataType.UUID, allowNull: true, field: 'lease_token' })
  leaseToken!: string | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'lease_expires_at' })
  leaseExpiresAt!: Date | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'sent_at' })
  sentAt!: Date | null
}
