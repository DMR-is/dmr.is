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

export const isToday = (
  firstDate: Date | string,
  secondDate: Date | string,
): boolean => {
  const first = new Date(firstDate)
  const second = new Date(secondDate)

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
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
