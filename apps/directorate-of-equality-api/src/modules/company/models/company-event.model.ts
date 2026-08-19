import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { UserModel } from '../../user/models/user.model'
import type { CompanyEventDto } from '../dto/company-event.dto'
import { CompanyStatusEnum } from './company.enums'
import { CompanyModel } from './company.model'

/**
 * Timeline event types for a company. Mirrors the report-event pattern but
 * scoped to the company lifecycle.
 *
 *   CREATED        → the company was registered. Origin point of the timeline;
 *                    no from/to status (status holds the initial status).
 *   STATUS_CHANGED → an admin moved the company between ACTIVE/INACTIVE.
 *                    Carries from/to status and an optional reason.
 *   FINES_STARTED  → an admin flagged the company as being in the daily-fines
 *                    process (handled outside this system). No from/to status;
 *                    carries an optional reason.
 *   FINES_STOPPED  → an admin cleared the daily-fines flag. No from/to status;
 *                    carries an optional reason.
 *   QUARANTINED    → an admin halted the company (all outbound activity
 *                    suspended). No from/to status; carries an optional reason.
 *   UNQUARANTINED  → an admin lifted the quarantine. No from/to status;
 *                    carries an optional reason.
 *   EQUALITY_REPORT_DEADLINE_REMINDER_SENT / SALARY_REPORT_DEADLINE_REMINDER_SENT
 *                  → emitted by the report-deadline-reminder task when a
 *                    6-months-before notification is sent. `reason` holds the
 *                    ISO due date being reminded about, which makes the task
 *                    idempotent per cycle (a new due date re-arms the reminder).
 *   EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL / SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL
 *                  → emitted by the same task when a reminder is due but the
 *                    company has no email on file, so nothing could be sent.
 *                    Same `reason`/idempotency rule as the SENT events: one row
 *                    per company per due date, not one per run.
 *   EQUALITY_MAILBOX_NOTICE_SENT / SALARY_MAILBOX_NOTICE_SENT
 *                  → emitted by the same task for the two overdue milestones
 *                    that are served into the company's island.is mailbox
 *                    (Pósthólf) rather than emailed. Same `reason`/idempotency
 *                    rule, and there is no NO_EMAIL counterpart: mailbox
 *                    delivery keys off `company.national_id`, which is NOT NULL,
 *                    so the no-contact-details outcome cannot arise.
 *
 *                    These rows are also the **issuance registry** the Skjalaveita
 *                    callback authorises against — a document is only served if a
 *                    matching row exists. That makes the partial unique index on
 *                    (company_id, event_type, reminder_tier, reason) load-bearing
 *                    rather than a nicety; see
 *                    `m-20260819-postholf-mailbox-notices.js`.
 */
export enum CompanyEventTypeEnum {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  FINES_STARTED = 'FINES_STARTED',
  FINES_STOPPED = 'FINES_STOPPED',
  QUARANTINED = 'QUARANTINED',
  UNQUARANTINED = 'UNQUARANTINED',
  EQUALITY_REPORT_DEADLINE_REMINDER_SENT = 'EQUALITY_REPORT_DEADLINE_REMINDER_SENT',
  SALARY_REPORT_DEADLINE_REMINDER_SENT = 'SALARY_REPORT_DEADLINE_REMINDER_SENT',
  EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL = 'EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL',
  SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL = 'SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL',
  EQUALITY_MAILBOX_NOTICE_SENT = 'EQUALITY_MAILBOX_NOTICE_SENT',
  SALARY_MAILBOX_NOTICE_SENT = 'SALARY_MAILBOX_NOTICE_SENT',
}

/**
 * Deadline-reminder event types the reminder task may emit — both the
 * reminder-sent outcomes and the no-email-on-file outcomes. The kind of report
 * lives in the event type; which milestone fired lives in `reminderTier`. All
 * carry the ISO due date in `reason` and are deduped on
 * (companyId, eventType, reminderTier, reason).
 */
export type CompanyDeadlineReminderEventType =
  | CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT
  | CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_SENT
  | CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL
  | CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL
  | CompanyEventTypeEnum.EQUALITY_MAILBOX_NOTICE_SENT
  | CompanyEventTypeEnum.SALARY_MAILBOX_NOTICE_SENT

/**
 * Which deadline milestone a reminder event records. The reminder task walks
 * these as contiguous bands (each owns the range down to the next), so a
 * deadline sits in exactly one tier at a time:
 *
 *   SIX_MONTHS      → due in (2 months, 6 months]      email
 *   TWO_MONTHS      → due in (2 weeks, 2 months]        email
 *   TWO_WEEKS       → due in (now, 2 weeks]             email
 *   DUE             → due today or recently overdue     email
 *   OVERDUE_NOTICE  → overdue past the Áminning offset   island.is mailbox
 *   FINES_PRECURSOR → overdue past the dagsektir offset  island.is mailbox
 *
 * The last two are the flowchart's formal steps ("Áminning á að skilafrestur er
 * útrunninn" and "Undanfari á dagsektum"). They are **mailbox-only**: see
 * `MAILBOX_TIERS` / `EmailReminderTier` in the reminder task for the split, which
 * is enforced by the type system rather than by convention.
 *
 * Null for every non-reminder event.
 */
export enum CompanyReminderTierEnum {
  SIX_MONTHS = 'SIX_MONTHS',
  TWO_MONTHS = 'TWO_MONTHS',
  TWO_WEEKS = 'TWO_WEEKS',
  DUE = 'DUE',
  OVERDUE_NOTICE = 'OVERDUE_NOTICE',
  FINES_PRECURSOR = 'FINES_PRECURSOR',
}

/**
 * The tiers delivered by email. Narrower than `CompanyReminderTierEnum` on
 * purpose: the mail templates are typed against this, so adding an email body for
 * a mailbox tier is a compile error rather than a silent second channel that one
 * `company_event` row cannot describe.
 */
export type EmailReminderTier =
  | CompanyReminderTierEnum.SIX_MONTHS
  | CompanyReminderTierEnum.TWO_MONTHS
  | CompanyReminderTierEnum.TWO_WEEKS
  | CompanyReminderTierEnum.DUE

/** The tiers served into the island.is mailbox. Complement of `EmailReminderTier`. */
export type MailboxReminderTier =
  | CompanyReminderTierEnum.OVERDUE_NOTICE
  | CompanyReminderTierEnum.FINES_PRECURSOR

type CompanyEventAttributes = {
  companyId: string
  eventType: CompanyEventTypeEnum
  actorUserId: string | null
  status: CompanyStatusEnum
  fromStatus: CompanyStatusEnum | null
  toStatus: CompanyStatusEnum | null
  reason: string | null
  reminderTier: CompanyReminderTierEnum | null
}

type CompanyEventCreateAttributes = {
  companyId: string
  eventType: CompanyEventTypeEnum
  actorUserId?: string | null
  status: CompanyStatusEnum
  fromStatus?: CompanyStatusEnum | null
  toStatus?: CompanyStatusEnum | null
  reason?: string | null
  reminderTier?: CompanyReminderTierEnum | null
}

@ImmutableTable({ tableName: DoeModels.COMPANY_EVENT })
export class CompanyEventModel extends ImmutableModel<
  CompanyEventAttributes,
  CompanyEventCreateAttributes
> {
  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @Column({
    type: DataType.ENUM(...Object.values(CompanyEventTypeEnum)),
    allowNull: false,
    field: 'event_type',
  })
  eventType!: CompanyEventTypeEnum

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'actor_user_id' })
  actorUserId!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(CompanyStatusEnum)),
    allowNull: false,
  })
  status!: CompanyStatusEnum

  @Column({
    type: DataType.ENUM(...Object.values(CompanyStatusEnum)),
    allowNull: true,
    field: 'from_status',
  })
  fromStatus!: CompanyStatusEnum | null

  @Column({
    type: DataType.ENUM(...Object.values(CompanyStatusEnum)),
    allowNull: true,
    field: 'to_status',
  })
  toStatus!: CompanyStatusEnum | null

  @Column({ type: DataType.TEXT, allowNull: true })
  reason!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(CompanyReminderTierEnum)),
    allowNull: true,
    field: 'reminder_tier',
  })
  reminderTier!: CompanyReminderTierEnum | null

  @BelongsTo(() => CompanyModel, { foreignKey: 'companyId', as: 'company' })
  company?: CompanyModel

  @BelongsTo(() => UserModel, { foreignKey: 'actorUserId', as: 'actor' })
  actor?: UserModel | null

  static fromModel(model: CompanyEventModel): CompanyEventDto {
    return {
      id: model.id,
      companyId: model.companyId,
      eventType: model.eventType,
      actorUserId: model.actorUserId,
      actorName: model.actor
        ? `${model.actor.firstName} ${model.actor.lastName}`
        : null,
      status: model.status,
      fromStatus: model.fromStatus,
      toStatus: model.toStatus,
      reason: model.reason,
      reminderTier: model.reminderTier,
      createdAt: model.createdAt,
    }
  }

  fromModel(): CompanyEventDto {
    return CompanyEventModel.fromModel(this)
  }
}
