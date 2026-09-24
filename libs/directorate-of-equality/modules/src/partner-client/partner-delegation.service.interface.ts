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
   *
   * Checks the delegation's own `revoked_at` only. The caller must already
   * have refused a revoked client — the partner API does, in
   * `ApiKeyVerifyService`, before this is reached — since a live delegation
   * under a revoked client is not live.
   */
  findLive(
    partnerClientId: string,
    companyNationalId: string,
  ): Promise<PartnerDelegationModel | null>

  /**
   * Every live delegation to one firm, newest first. Same precondition as
   * `findLive`: the caller has already refused a revoked client.
   */
  listLiveForClient(partnerClientId: string): Promise<PartnerDelegationDto[]>
}

export const IPartnerDelegationService = Symbol('IPartnerDelegationService')
