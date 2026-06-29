import { CompanyEventDto } from '../company/dto/company-event.dto'
import { CompanyStatusEnum } from '../company/models/company.enums'
import {
  CompanyDeadlineReminderEventType,
  CompanyReminderTierEnum,
} from '../company/models/company-event.model'

export interface ICompanyEventService {
  /** Origin event for a freshly registered company. */
  emitCreated(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
  ): Promise<void>

  /** Records an ACTIVE/INACTIVE transition with optional reason. */
  emitStatusChanged(
    companyId: string,
    fromStatus: CompanyStatusEnum,
    toStatus: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void>

  /** Records the company being flagged into the daily-fines process. */
  emitFinesStarted(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void>

  /** Records the company being cleared from the daily-fines process. */
  emitFinesStopped(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void>

  /** Records the company being quarantined (all outbound activity halted). */
  emitQuarantined(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void>

  /** Records the company's quarantine being lifted. */
  emitUnquarantined(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void>

  /** All events for a company, oldest first — used to build the timeline. */
  getByCompanyId(companyId: string): Promise<CompanyEventDto[]>

  /**
   * True if a deadline event of `eventType` at `tier` was already recorded for
   * this exact `dueDateIso`. Used by the reminder task to stay idempotent across
   * daily runs and multiple containers — covers both the reminder-sent and
   * no-email outcomes, per milestone.
   */
  hasDeadlineReminderEvent(
    companyId: string,
    eventType: CompanyDeadlineReminderEventType,
    tier: CompanyReminderTierEnum,
    dueDateIso: string,
  ): Promise<boolean>

  /**
   * Records a deadline-reminder outcome for one milestone (`tier`) — either the
   * reminder being sent or there being no email on file (per `eventType`).
   * `dueDateIso` (stored in `reason`) is the due date being reminded about.
   */
  emitDeadlineReminderEvent(
    companyId: string,
    status: CompanyStatusEnum,
    eventType: CompanyDeadlineReminderEventType,
    tier: CompanyReminderTierEnum,
    dueDateIso: string,
  ): Promise<void>
}

export const ICompanyEventService = Symbol('ICompanyEventService')
