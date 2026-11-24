import { BadRequestException } from '@nestjs/common'

import {
  PUBLISHABLE_ADVERT_STATUS_IDS,
  StatusIdEnum,
} from '../enums/status.enum'

/**
 * Non-editable statuses - adverts in these states cannot be modified
 */
export const NON_EDITABLE_STATUSES = [
  StatusIdEnum.PUBLISHED,
  StatusIdEnum.REJECTED,
  StatusIdEnum.WITHDRAWN,
] as const

/**
 * Throws BadRequestException if the advert is in a non-editable state
 *
 * @param advert - Object containing statusId property
 * @param context - Context description for error message (default: 'advert')
 * @throws {BadRequestException} When advert is in a terminal state
 */
export function assertAdvertEditable(
  advert: { statusId: StatusIdEnum },
  context = 'advert',
): void {
  if (
    (NON_EDITABLE_STATUSES as readonly StatusIdEnum[]).includes(advert.statusId)
  ) {
    throw new BadRequestException(
      `Cannot modify ${context} - advert is in a terminal state`,
    )
  }
}

/**
 * Throws BadRequestException if any advert in the array is non-editable
 *
 * @param adverts - Array of objects containing statusId property
 * @param context - Context description for error message (default: 'record')
 * @throws {BadRequestException} When any advert is in a terminal state
 */
export function assertAdvertsEditable(
  adverts: { statusId: StatusIdEnum }[],
  context = 'record',
): void {
  const hasNonEditable = adverts.some((a) =>
    (NON_EDITABLE_STATUSES as readonly StatusIdEnum[]).includes(a.statusId),
  )

  if (hasNonEditable) {
    throw new BadRequestException(
      `Cannot modify ${context} - has published/finalized adverts`,
    )
  }
}

/**
 * Statuses an advert may be in for a publication to be published: the shared
 * `PUBLISHABLE_ADVERT_STATUS_IDS` (what `AdvertModel.canPublish` allows), plus
 * PUBLISHED, for a second same-day publication of an advert the first one
 * already set PUBLISHED. `canPublish` does not allow PUBLISHED.
 */
const PUBLISHABLE_STATUSES: readonly StatusIdEnum[] = [
  ...PUBLISHABLE_ADVERT_STATUS_IDS,
  StatusIdEnum.PUBLISHED,
]

/**
 * The check both publish paths make after taking the advert row lock, on the
 * freshly read rows: the publication is not out yet and the advert is still in
 * a status it may be published from.
 */
export const isStillPublishable = (
  publication: { publishedAt?: Date | null },
  advert: { statusId: StatusIdEnum },
): boolean =>
  !publication.publishedAt && PUBLISHABLE_STATUSES.includes(advert.statusId)
