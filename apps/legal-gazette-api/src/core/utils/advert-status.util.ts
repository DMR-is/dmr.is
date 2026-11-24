import { BadRequestException } from '@nestjs/common'

import { StatusIdEnum } from '../../models/status.model'

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
 * Statuses an advert can be in with none of its publications publishable:
 * a rejected or withdrawn advert is never published. A PUBLISHED or
 * IN_PUBLISHING advert still publishes its remaining publications.
 */
const NON_PUBLISHABLE_STATUSES: readonly StatusIdEnum[] = [
  StatusIdEnum.REJECTED,
  StatusIdEnum.WITHDRAWN,
]

/**
 * The check both publish paths make after taking the advert row lock, on the
 * freshly read rows: the publication is not out yet and the advert has not
 * been rejected or withdrawn since it was selected.
 */
export const isStillPublishable = (
  publication: { publishedAt?: Date | null },
  advert: { statusId: StatusIdEnum },
): boolean =>
  !publication.publishedAt &&
  !NON_PUBLISHABLE_STATUSES.includes(advert.statusId)
