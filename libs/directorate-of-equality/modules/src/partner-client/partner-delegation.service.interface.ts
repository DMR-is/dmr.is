import { PartnerDelegationDto } from './dto/partner-delegation.dto'
import { PartnerDelegationModel } from './models/partner-delegation.model'

export interface IPartnerDelegationService {
  /**
   * The live delegation from one company to one firm, or null.
   *
   * **The one lookup every answer to "may this firm act for this company"
   * goes through**: the partner API's guard, and the self-service web's
   * "connected" state. Two queries that agree today are how this codebase has
   * repeatedly ended up with a screen that says yes and a route that says no.
   */
  findLive(
    partnerClientId: string,
    companyNationalId: string,
  ): Promise<PartnerDelegationModel | null>

  /** Every live delegation to one firm, newest first. */
  listLiveForClient(partnerClientId: string): Promise<PartnerDelegationDto[]>
}

export const IPartnerDelegationService = Symbol('IPartnerDelegationService')
