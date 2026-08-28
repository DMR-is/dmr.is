import { ReportProviderEnum } from '../report/models/report.enums'

/**
 * Injection token for the channel an app submits on behalf of.
 */
export const REPORT_PROVIDER_CHANNEL = Symbol('REPORT_PROVIDER_CHANNEL')

/**
 * Which upstream channel a running service speaks for, and how it names the
 * submissions arriving on it.
 *
 * `ApplicationService` is shared by two apps that are the same code on different
 * channels: island.is over X-Road, and the partner API over the internet. The
 * channel used to be a hardcoded constant, which was correct while there was one
 * caller and wrong the moment there were two.
 *
 * Injected rather than passed per call so it cannot be forgotten at one of the
 * six sites that need it — and so it can never come from a request body. A
 * caller that could name its own channel could file a report as though it had
 * arrived from island.is.
 */
export type ReportProviderChannel = {
  providerType: ReportProviderEnum

  /**
   * Turns the caller's own submission id into the one stored in
   * `report.provider_id`.
   *
   * Uniqueness is enforced on `(provider_type, provider_id)`, which separates
   * the channels from each other but not the callers *within* a channel. On
   * island.is that is fine: the id is an application UUID minted by one system.
   * On the partner channel every vendor picks its own ids, so two of them
   * sending `"1"` would collide — one getting a 409 caused by an unrelated
   * company, which also leaks that the id is taken.
   */
  buildProviderId(clientId: string, companyNationalId: string): string
}

/**
 * island.is: the id is the application's own UUID, stored as given. Namespacing
 * it would be a migration of every existing row for no benefit — one upstream
 * system mints these and they are already unique.
 */
export const ISLAND_IS_PROVIDER_CHANNEL: ReportProviderChannel = {
  providerType: ReportProviderEnum.ISLAND_IS,
  buildProviderId: (clientId) => clientId,
}

/**
 * The partner API. `OTHER` was already in `report_provider_enum` from the
 * baseline migration — the schema anticipated a third channel — so this needed
 * no enum change.
 *
 * The prefix is the authenticated company's kennitala, taken from the verified
 * API key rather than the payload, so a vendor can neither collide with another
 * company nor file under one.
 */
export const EXTERNAL_PROVIDER_CHANNEL: ReportProviderChannel = {
  providerType: ReportProviderEnum.OTHER,
  buildProviderId: (clientId, companyNationalId) =>
    `${companyNationalId}:${clientId}`,
}
