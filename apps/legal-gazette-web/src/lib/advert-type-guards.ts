import { AdvertDetailedDto } from '../gen/fetch'

export const isBankruptcyRecallAdvert = (
  advert: AdvertDetailedDto,
): boolean => {
  return advert.type.id.toLowerCase() === '065c3fd9-58d1-436f-9fb8-c1f5c214fa50' // Innköllun þrotabú
}

export const isDeceasedRecallAdvert = (advert: AdvertDetailedDto): boolean => {
  return advert.type.id.toLowerCase() === 'bc6384f4-91b0-48fe-9a3a-b528b0aa6468' // Innköllun dánarbú
}

export const isDivisionEndingAdvert = (advert: AdvertDetailedDto): boolean => {
  return advert.type.id.toLowerCase() === 'd40bed80-6d9c-4388-aea8-445b27614d8a' // Skiptalok
}

export const isDivisionMeetingAdvert = (advert: AdvertDetailedDto): boolean => {
  return advert.type.id.toLowerCase() === 'f1a7ce20-37be-451b-8aa7-bc90b8a7e7bd' // Skiptafundur
}
