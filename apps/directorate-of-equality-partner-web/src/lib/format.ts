import {
  CompanyObligationStatusEnum,
  CompanySizeEnum,
} from '../gen/fetch/types.gen'
import { companyText, keyText } from './text'

const IS_MONTHS = [
  'janúar',
  'febrúar',
  'mars',
  'apríl',
  'maí',
  'júní',
  'júlí',
  'ágúst',
  'september',
  'október',
  'nóvember',
  'desember',
]

/** An instant as "24. september 2026", as directorate-of-equality-web shows it. */
export const formatDateIS = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  return `${day}. ${IS_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "5005101370" → "500510-1370". Anything not ten digits is returned as is. */
export const formatNationalId = (nationalId = '') => {
  const cleaned = nationalId.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) {
    return nationalId
  }
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`
}

export const COMPANY_SIZE_LABEL: Record<CompanySizeEnum, string> = {
  [CompanySizeEnum.UNKNOWN]: companyText.sizeUnknown,
  [CompanySizeEnum.SMALL]: companyText.sizeSmall,
  [CompanySizeEnum.MEDIUM]: companyText.sizeMedium,
  [CompanySizeEnum.LARGE]: companyText.sizeLarge,
}

export const OBLIGATION_LABEL: Record<CompanyObligationStatusEnum, string> = {
  [CompanyObligationStatusEnum.NOT_REQUIRED]: companyText.obligationNotRequired,
  [CompanyObligationStatusEnum.MISSING]: companyText.obligationMissing,
  [CompanyObligationStatusEnum.ACTION_PLAN_MISSING]:
    companyText.obligationActionPlanMissing,
  [CompanyObligationStatusEnum.COVERED]: companyText.obligationCovered,
}

/** Tag colours as on the reviewer side, so the two read as one system. */
export const OBLIGATION_TAG_VARIANT: Record<
  CompanyObligationStatusEnum,
  'red' | 'mint' | 'dark' | 'blue'
> = {
  [CompanyObligationStatusEnum.NOT_REQUIRED]: 'blue',
  [CompanyObligationStatusEnum.MISSING]: 'red',
  [CompanyObligationStatusEnum.ACTION_PLAN_MISSING]: 'dark',
  [CompanyObligationStatusEnum.COVERED]: 'mint',
}

export type KeyState = 'active' | 'revoked' | 'expired'

type KeyLike = { revokedAt?: string | null; expiresAt?: string | null }

/**
 * Revoked is shown before expired when a key is both: revocation is a decision
 * somebody made, expiry is just time passing.
 */
export const keyState = (key: KeyLike): KeyState => {
  if (key.revokedAt) return 'revoked'
  if (key.expiresAt && new Date(key.expiresAt) <= new Date()) return 'expired'
  return 'active'
}

export const KEY_STATE_LABEL: Record<KeyState, string> = {
  active: keyText.statusActive,
  revoked: keyText.statusRevoked,
  expired: keyText.statusExpired,
}

export const KEY_STATE_VARIANT: Record<KeyState, 'blue' | 'red' | 'disabled'> =
  {
    active: 'blue',
    revoked: 'red',
    expired: 'disabled',
  }

type IssuedKeyLike = {
  createdVia: 'ISLAND_IS' | 'ADMIN'
  createdByNationalId?: string | null
}

/**
 * Who minted a key. A reviewer-issued key names no person on this side — the
 * reviewer is a Jafnréttisstofa user — so the origin decides what to show.
 */
export const issuedBy = (key: IssuedKeyLike): string =>
  key.createdVia === 'ADMIN'
    ? keyText.createdViaAdmin
    : key.createdByNationalId
      ? formatNationalId(key.createdByNationalId)
      : keyText.createdViaIslandIs
