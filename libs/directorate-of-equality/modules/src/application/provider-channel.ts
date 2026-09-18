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

  /**
   * Inverse of `buildProviderId`: the id the CALLER knows this report by, or
   * null when the report did not arrive on this channel.
   *
   * Needed because a caller only ever quotes its own id — the stored form is
   * ours. Reading `report.provider_id` back raw would hand an integrator a
   * value it never sent (and, on the partner channel, one prefixed with a
   * kennitala it has no use for).
   *
   * Returning null for a foreign channel is the load-bearing half: a report the
   * company filed on island.is is not addressable through the partner API, and
   * a handle the caller can only ever 404 on is worse than no handle.
   */
  toClientProviderId(report: ClientProviderIdSource): string | null
}

/**
 * The columns `toClientProviderId` needs. Structural rather than `ReportModel`
 * so the channel stays free of the model layer, and so a caller can pass a
 * plain row.
 */
export type ClientProviderIdSource = {
  providerType: ReportProviderEnum | null
  providerId: string | null
  /**
   * The company the report was filed for, i.e. what `buildProviderId` was given
   * as `companyNationalId` at creation (`report.company_national_id`).
   */
  companyNationalId: string | null
}

/**
 * island.is: the id is the application's own UUID, stored as given. Namespacing
 * it would be a migration of every existing row for no benefit — one upstream
 * system mints these and they are already unique.
 */
export const ISLAND_IS_PROVIDER_CHANNEL: ReportProviderChannel = {
  providerType: ReportProviderEnum.ISLAND_IS,
  buildProviderId: (clientId) => clientId,
  toClientProviderId: (report) =>
    report.providerType === ReportProviderEnum.ISLAND_IS
      ? report.providerId
      : null,
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
  toClientProviderId: (report) => {
    if (report.providerType !== ReportProviderEnum.OTHER) {
      return null
    }

    const { providerId, companyNationalId } = report
    if (!providerId || !companyNationalId) {
      return null
    }

    // Strip the namespace this channel added, rather than splitting on ':'. A
    // vendor's own id may contain a colon, so `split(':')[1]` would truncate
    // it; and requiring the prefix means a row stored under a different
    // company's namespace returns null instead of leaking a foreign id.
    const prefix = `${companyNationalId}:`

    return providerId.startsWith(prefix)
      ? providerId.slice(prefix.length)
      : null
  },
}
