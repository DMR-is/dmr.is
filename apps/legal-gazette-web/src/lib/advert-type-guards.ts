import { AdvertDetailedDto } from '../gen/fetch'

export const isBankruptcyRecallAdvert = (
  advert: AdvertDetailedDto,
): boolean => {
  return advert.type.title === 'Innköllun þrotabú'
}

export const isDeceasedRecallAdvert = (advert: AdvertDetailedDto): boolean => {
  return advert.type.title === 'Innköllun dánarbú'
}

export const isDivisionEndingAdvert = (advert: AdvertDetailedDto): boolean => {
  return advert.type.title === 'Skiptalok'
}

export const isDivisionMeetingAdvert = (advert: AdvertDetailedDto): boolean => {
  return advert.type.title === 'Skiptafundur'
}
