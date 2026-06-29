import { CompanyEventDto } from '../company/dto/company-event.dto'
import { CompanyStatusEnum } from '../company/models/company.enums'
import { CompanyDeadlineReminderEventType } from '../company/models/company-event.model'

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
   * True if a deadline reminder of `eventType` was already recorded for this
   * exact `dueDateIso`. Used by the reminder task to stay idempotent across
   * daily runs and multiple containers.
   */
  hasDeadlineReminderBeenSent(
    companyId: string,
    eventType: CompanyDeadlineReminderEventType,
    dueDateIso: string,
  ): Promise<boolean>

  /**
   * Records that a 6-months-before deadline reminder was sent. `dueDateIso`
   * (stored in `reason`) is the due date being reminded about.
   */
  emitDeadlineReminderSent(
    companyId: string,
    status: CompanyStatusEnum,
    eventType: CompanyDeadlineReminderEventType,
    dueDateIso: string,
  ): Promise<void>
}

export const ICompanyEventService = Symbol('ICompanyEventService')
