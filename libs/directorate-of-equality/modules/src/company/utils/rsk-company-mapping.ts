import { AddressDto, LegalEntityDto } from '@dmr.is/clients-rsk-client'

import { CompanyStatusEnum } from '../models/company.enums'

/**
 * The subset of a company we can derive from an RSK legal-entity payload,
 * expressed in RSK's own values. The service resolves `postcodeCode` and
 * `isatCode` against our reference tables before persisting; everything here is
 * pure (no DB access) so it is trivially testable.
 *
 * `employeeCountCategory` is intentionally absent — RSK does not carry it.
 */
export type RskCompanyMapping = {
  /** Street address (RSK `addresses[].addressName`). */
  address: string | null
  /** 3-digit postcode extracted from the chosen RSK address. */
  postcodeCode: string | null
  /** ÍSAT2008 code (digits only) from the first matching activity code. */
  isatCode: string | null
  /** Derived from RSK deregistration state. */
  status: CompanyStatusEnum
  /**
   * Human-readable reason the entity is not active, or null when it is active.
   * Surfaced on the create screen to explain why creation is blocked.
   */
  statusReason: string | null
}

function isIsatCodeSystem(codeSystem: string): boolean {
  const upper = codeSystem.toUpperCase()
  // Match both the ASCII ("ISAT") and accented ("ÍSAT") spellings.
  return upper.includes('ISAT') || upper.includes('ÍSAT')
}

/**
 * Pick the address to store. RSK returns several entries keyed by `type`; we
 * take the first one that actually carries a street name. (Type values are not
 * yet confirmed against live data — revisit to prefer the legal/registered
 * address explicitly once we know the vocabulary.)
 */
function pickAddress(entity: LegalEntityDto): AddressDto | null {
  return entity.addresses?.find((a) => !!a.addressName?.trim()) ?? null
}

function pickAddressName(entity: LegalEntityDto): string | null {
  return pickAddress(entity)?.addressName?.trim() || null
}

function pickPostcodeCode(entity: LegalEntityDto): string | null {
  const raw = pickAddress(entity)?.postcode
  // RSK may return "101" or "101 Reykjavík" — keep the first 3-digit group.
  const match = raw?.match(/\d{3}/)
  return match ? match[0] : null
}

/**
 * The first ÍSAT2008 activity code, digits only. Prefers entries whose
 * `codeSystem` names ÍSAT (accent/case-insensitive); if none identify their
 * system, falls back to the first activity code. "First in the array" is the
 * agreed rule when several are present. Returns null when there is nothing to
 * map — the caller still validates the code against the reference table.
 */
function pickIsatCode(entity: LegalEntityDto): string | null {
  const codes = entity.activityCode ?? []
  if (codes.length === 0) {
    return null
  }

  const isatMatches = codes.filter((c) =>
    c.codeSystem ? isIsatCodeSystem(c.codeSystem) : false,
  )

  const chosen = (isatMatches.length > 0 ? isatMatches : codes)[0]
  const digits = chosen.id?.replace(/\D/g, '') || null
  return digits
}

function deriveStatus(entity: LegalEntityDto): CompanyStatusEnum {
  return entity.deregistration?.deregistered
    ? CompanyStatusEnum.INACTIVE
    : CompanyStatusEnum.ACTIVE
}

/**
 * A human-readable reason the entity is inactive, or null when it is active.
 * Prefers RSK's own status wording (already localized); otherwise describes the
 * deregistration flags. Wording can be refined once we see real payloads.
 */
function deriveStatusReason(entity: LegalEntityDto): string | null {
  const deregistration = entity.deregistration
  if (!deregistration?.deregistered) {
    return null
  }

  if (entity.status?.trim()) {
    return entity.status.trim()
  }

  if (deregistration.bankrupcy) {
    return 'Gjaldþrota'
  }

  if (deregistration.insolvency) {
    return 'Í greiðsluþroti'
  }

  return 'Afskráð úr fyrirtækjaskrá'
}

export function mapRskLegalEntity(entity: LegalEntityDto): RskCompanyMapping {
  return {
    address: pickAddressName(entity),
    postcodeCode: pickPostcodeCode(entity),
    isatCode: pickIsatCode(entity),
    status: deriveStatus(entity),
    statusReason: deriveStatusReason(entity),
  }
}
