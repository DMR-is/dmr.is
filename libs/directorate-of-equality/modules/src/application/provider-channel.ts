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

  /**
   * The handle the READ routes of this channel open a report by, or null when
   * it has none here. On island.is this reaches past the channel: a company
   * reads every report filed for it, whoever filed it (see
   * `ISLAND_IS_PROVIDER_CHANNEL`). Write routes never take it — they stay on
   * `buildProviderId`, scoped to this channel's own submissions.
   */
  toReadHandle(report: ClientProviderIdSource): string | null

  /**
   * Inverse of `toReadHandle`: the stored tuple a read handle names for the
   * authenticated company, or null when the handle names nothing. Ownership is
   * still checked by the caller, on the row this finds.
   */
  resolveReadHandle(
    handle: string,
    companyNationalId: string,
  ): StoredProviderTuple | null
}

/** A report's stored `(provider_type, provider_id)`. */
export type StoredProviderTuple = {
  providerType: ReportProviderEnum
  providerId: string
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
  toReadHandle: (report) => toIslandIsReadHandle(report),
  resolveReadHandle: (handle, companyNationalId) =>
    resolveIslandIsReadHandle(handle, companyNationalId),
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
  // The partner API reads only what it filed: its read handle is its own id.
  toReadHandle: (report) =>
    EXTERNAL_PROVIDER_CHANNEL.toClientProviderId(report),
  resolveReadHandle: (handle, companyNationalId) => ({
    providerType: ReportProviderEnum.OTHER,
    providerId: EXTERNAL_PROVIDER_CHANNEL.buildProviderId(
      handle,
      companyNationalId,
    ),
  }),
}

/**
 * Prefixes the island.is read routes use for reports island.is did not file.
 *
 * A bare handle stays the island.is application id it has always been, so no
 * existing link changes meaning. Prefixed rather than the internal `report.id`,
 * which the applicant never sees. An island.is id is an application UUID, so
 * it can never begin with either prefix.
 */
export const PARTNER_READ_HANDLE_PREFIX = 'partner:'
export const SYSTEM_READ_HANDLE_PREFIX = 'system:'

/**
 * - island.is: the application id, bare.
 * - partner API: `partner:<the firm's own id>`, the namespace stripped exactly
 *   as the partner channel strips it, so only a row stored under the report's
 *   own company kennitala gets a handle.
 * - SYSTEM (created by the Directorate): `system:<provider_id>`. Every SYSTEM
 *   row has one: the admin web sends a random id, `ReportCreateService` mints a
 *   UUID when none is given, and m-20261111-report-system-provider-ids
 *   backfilled the rest.
 */
const toIslandIsReadHandle = (
  report: ClientProviderIdSource,
): string | null => {
  switch (report.providerType) {
    case ReportProviderEnum.ISLAND_IS:
      return report.providerId
    case ReportProviderEnum.OTHER: {
      const clientId = EXTERNAL_PROVIDER_CHANNEL.toClientProviderId(report)
      return clientId ? `${PARTNER_READ_HANDLE_PREFIX}${clientId}` : null
    }
    case ReportProviderEnum.SYSTEM:
      return report.providerId
        ? `${SYSTEM_READ_HANDLE_PREFIX}${report.providerId}`
        : null
    default:
      return null
  }
}

const resolveIslandIsReadHandle = (
  handle: string,
  companyNationalId: string,
): StoredProviderTuple | null => {
  if (handle.startsWith(PARTNER_READ_HANDLE_PREFIX)) {
    const clientId = handle.slice(PARTNER_READ_HANDLE_PREFIX.length)
    // The namespace is the token company's kennitala, never one from the
    // handle: another company's partner report cannot be named this way.
    return clientId
      ? {
          providerType: ReportProviderEnum.OTHER,
          providerId: EXTERNAL_PROVIDER_CHANNEL.buildProviderId(
            clientId,
            companyNationalId,
          ),
        }
      : null
  }

  if (handle.startsWith(SYSTEM_READ_HANDLE_PREFIX)) {
    const providerId = handle.slice(SYSTEM_READ_HANDLE_PREFIX.length)
    return providerId
      ? { providerType: ReportProviderEnum.SYSTEM, providerId }
      : null
  }

  return handle
    ? { providerType: ReportProviderEnum.ISLAND_IS, providerId: handle }
    : null
}
