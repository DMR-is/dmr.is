import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'

import { AdvertModel, AdvertVersionEnum } from '../modules/advert/advert.model'
import { StatusIdEnum } from '../modules/status/status.model'

export const mapIndexToVersion = (index: number): AdvertVersionEnum => {
  switch (index) {
    case 0:
      return AdvertVersionEnum.A
    case 1:
      return AdvertVersionEnum.B
    case 2:
      return AdvertVersionEnum.C
    default:
      throw new Error(`Invalid index for advert version: ${index}`)
  }
}

export const isToday = (dateToCheck: Date | string): boolean => {
  const first = new Date(dateToCheck)
  const today = new Date()

  first.setHours(0, 0, 0, 0) // Reset time to midnight for comparison
  today.setHours(0, 0, 0, 0) // Reset time

  return first.getTime() === today.getTime()
}

export const isTodayOrInThePast = (dateToCheck: Date | string): boolean => {
  const date = new Date(dateToCheck)
  const today = new Date()

  today.setHours(0, 0, 0, 0) // Reset time to midnight for comparison
  date.setHours(0, 0, 0, 0) // Reset time to midnight for comparison

  return date <= today
}

export const validateAdvertStatus = (instance: AdvertModel): void => {
  const logger = getLogger('AdvertModel.validateAdvertStatus')

  const allowedStatuses = [
    StatusIdEnum.SUBMITTED,
    StatusIdEnum.READY_FOR_PUBLICATION,
  ]

  if (!instance.statusId) {
    logger.error(`Attempted to update advert without a status ID`, {
      context: 'AdvertModel',
    })
    throw new InternalServerErrorException()
  }

  if (!allowedStatuses.includes(instance.statusId)) {
    logger.error(
      `Attempted to update advert with invalid status ID: ${instance.statusId}`,
      {
        context: 'AdvertModel',
      },
    )
    throw new BadRequestException('Invalid advert status for update')
  }
}
