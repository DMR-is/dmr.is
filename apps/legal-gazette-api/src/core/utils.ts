import { AdvertVersionEnum } from './enums/advert-version.enum'

export const mapVersionToIndex = (version: AdvertVersionEnum) => {
  switch (version) {
    case AdvertVersionEnum.A:
      return 1
    case AdvertVersionEnum.B:
      return 2
    case AdvertVersionEnum.C:
      return 3
  }
}

export const isToday = (dateToCheck: Date | string): boolean => {
  const first = new Date(dateToCheck)
  const today = new Date()

  first.setHours(0, 0, 0, 0) // Reset time to midnight for comparison
  today.setHours(0, 0, 0, 0) // Reset time

  return first.getTime() === today.getTime()
}
