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
