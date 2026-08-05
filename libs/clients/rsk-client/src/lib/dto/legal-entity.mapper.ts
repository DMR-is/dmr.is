import type { LegalEntity } from '../../gen/fetch'
import type {
  ActivityCodeDto,
  AddressDto,
  DeregistrationDto,
  LegalEntityDto,
} from './legal-entity.dto'

/**
 * The RSK company registry serves PascalCase JSON, but the generated OpenAPI
 * types (and therefore the `LegalEntity` the SDK claims to return) are
 * camelCase. These raw interfaces describe the payload as it actually arrives
 * on the wire, so the mapping below can read it type-safely. Only the nodes the
 * domain consumes are modelled.
 */
interface RawDeregistration {
  Deregistered?: boolean
  DeregistrationDate?: string | null
  Bankrupcy?: boolean
  BankrupcyDate?: string | null
  Insolvency?: boolean
  InsolvencyDate?: string | null
}

interface RawActivityCode {
  Type?: string | null
  CodeSystem?: string | null
  Id?: string | null
  Name?: string | null
}

interface RawAddress {
  Type?: string | null
  AddressName?: string | null
  Postcode?: string | null
  City?: string | null
  Municipality?: string | null
  MunicipalityId?: string | null
  Country?: string | null
  CountryCode?: string | null
}

interface RawLegalEntity {
  NationalId?: string
  Name?: string
  Status?: string
  Deregistration?: RawDeregistration
  ActivityCode?: RawActivityCode[]
  Addresses?: RawAddress[]
}

function mapDeregistration(
  raw: RawDeregistration | undefined,
): DeregistrationDto | null {
  if (!raw) {
    return null
  }

  return {
    deregistered: raw.Deregistered ?? false,
    deregistrationDate: raw.DeregistrationDate ?? null,
    bankrupcy: raw.Bankrupcy ?? false,
    bankrupcyDate: raw.BankrupcyDate ?? null,
    insolvency: raw.Insolvency ?? false,
    insolvencyDate: raw.InsolvencyDate ?? null,
  }
}

function mapActivityCode(raw: RawActivityCode): ActivityCodeDto {
  return {
    type: raw.Type ?? null,
    codeSystem: raw.CodeSystem ?? null,
    id: raw.Id ?? null,
    name: raw.Name ?? null,
  }
}

function mapAddress(raw: RawAddress): AddressDto {
  return {
    type: raw.Type ?? null,
    addressName: raw.AddressName ?? null,
    postcode: raw.Postcode ?? null,
    city: raw.City ?? null,
    municipality: raw.Municipality ?? null,
    municipalityId: raw.MunicipalityId ?? null,
    country: raw.Country ?? null,
    countryCode: raw.CountryCode ?? null,
  }
}

/**
 * Map a raw RSK legal-entity response into the domain `LegalEntityDto`.
 *
 * The SDK types the response as the (camelCase) generated `LegalEntity`, but the
 * live payload is PascalCase, so we reinterpret it as `RawLegalEntity` — the
 * one documented cast at the client boundary.
 */
export function mapLegalEntityResponse(response: LegalEntity): LegalEntityDto {
  const raw = response as unknown as RawLegalEntity

  return {
    nationalId: raw.NationalId ?? '',
    name: raw.Name ?? '',
    status: raw.Status ?? null,
    deregistration: mapDeregistration(raw.Deregistration),
    activityCode: (raw.ActivityCode ?? []).map(mapActivityCode),
    addresses: (raw.Addresses ?? []).map(mapAddress),
  }
}
