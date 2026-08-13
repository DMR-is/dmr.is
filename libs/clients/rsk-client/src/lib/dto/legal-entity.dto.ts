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

/**
 * RSK's registered legal form (rekstrarform) — e.g. hf., ehf., a state
 * institution, a municipality. This is the only field in the payload that
 * distinguishes *who owns* an entity; `activityCode` only says what it does, so
 * a state-owned hospital and a private clinic are indistinguishable by ÍSAT
 * alone. Consumers deriving a public/private sector should map `id` (the stable
 * machine key) and keep `name` for display and for spotting unmapped forms.
 */
export interface LegalFormDto {
  /** RSK's stable form code. */
  id: string | null
  /** Localized form name, e.g. "Hlutafélag". */
  name: string | null
}

/**
 * One VAT (VSK) registration. An entity holds one per taxable activity — so
 * several, or none. Note this is a *registration*, not a classification: it
 * carries its own `activityCode`, which is the useful part when the
 * entity-level `activityCode` array comes back empty.
 *
 * VAT presence is a poor proxy for public vs private in both directions (public
 * bodies are generally not VAT-registered for non-commercial administration but
 * often are for commercial side activities; exempt and dormant private entities
 * have none), so prefer `legalForm` for that.
 */
export interface VatDto {
  vatNumber: string | null
  registered: string | null
  deRegistered: string | null
  activityCode: ActivityCodeDto | null
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
  legalForm: LegalFormDto | null
  activityCode: ActivityCodeDto[]
  vat: VatDto[]
  addresses: AddressDto[]
}
