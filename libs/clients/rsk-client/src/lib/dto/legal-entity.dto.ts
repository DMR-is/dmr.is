/**
 * Domain-facing shape of an RSK legal entity, mapped from the raw company
 * registry response by `mapLegalEntityResponse`.
 *
 * Why this exists: the live RSK API returns PascalCase JSON (`NationalId`,
 * `Name`, `Deregistration`, …) while the generated OpenAPI types are camelCase
 * and the generated fetch client does no case conversion — so reading the raw
 * response directly yields `undefined` for every field. Rather than mutate the
 * response at the client layer, the service maps it explicitly into these DTOs.
 *
 * The shape mirrors the generated `LegalEntity` field names for the nodes the
 * domain actually consumes. Person-level `relationships` (board members,
 * founders — PII) are intentionally omitted; no consumer needs them.
 */

export interface DeregistrationDto {
  deregistered: boolean
  deregistrationDate: string | null
  bankrupcy: boolean
  bankrupcyDate: string | null
  insolvency: boolean
  insolvencyDate: string | null
}

export interface ActivityCodeDto {
  /** e.g. "Primary". */
  type: string | null
  /** e.g. "ISAT2008". */
  codeSystem: string | null
  /** The activity code itself, e.g. "62.01.0". */
  id: string | null
  /** Human-readable description of the activity. */
  name: string | null
}

export interface AddressDto {
  /** RSK address type, e.g. "Lögheimilisfang" (legal domicile) or "Póstfang". */
  type: string | null
  addressName: string | null
  postcode: string | null
  city: string | null
  municipality: string | null
  municipalityId: string | null
  country: string | null
  countryCode: string | null
}

export interface LegalEntityDto {
  nationalId: string
  name: string
  /** RSK's own localized status wording, e.g. "Virk skráning". */
  status: string | null
  deregistration: DeregistrationDto | null
  activityCode: ActivityCodeDto[]
  addresses: AddressDto[]
}
