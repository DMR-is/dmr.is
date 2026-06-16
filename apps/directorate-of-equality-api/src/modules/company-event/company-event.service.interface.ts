import { CompanyEventDto } from '../company/dto/company-event.dto'
import { CompanyStatusEnum } from '../company/models/company.enums'

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

  /** All events for a company, oldest first — used to build the timeline. */
  getByCompanyId(companyId: string): Promise<CompanyEventDto[]>
}

export const ICompanyEventService = Symbol('ICompanyEventService')
