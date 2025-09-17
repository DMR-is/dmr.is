import { AdvertDetailedDto } from '../gen/fetch'

const RECALLS = 'Innkallanir'

export const isBankruptcyRecallAdvert = (
  advert: AdvertDetailedDto,
): boolean => {
  return (
    advert.type.title === 'Innköllun þrotabús' &&
    advert.category.title === RECALLS
  )
}

export const isDeceasedRecallAdvert = (advert: AdvertDetailedDto): boolean => {
  return (
    advert.type.title === 'Innköllun dánarbú' &&
    advert.category.title === RECALLS
  )
}

export const isDivisionEndingAdvert = (advert: AdvertDetailedDto): boolean => {
  return advert.type.title === 'Skiptalok'
}
