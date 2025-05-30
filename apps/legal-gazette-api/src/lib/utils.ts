import { AdvertVersion } from '../modules/advert/advert.model'

export const mapIndexToVersion = (index: number): AdvertVersion => {
  switch (index) {
    case 0:
      return AdvertVersion.A
    case 1:
      return AdvertVersion.B
    case 2:
      return AdvertVersion.C
    default:
      throw new Error(`Invalid index for advert version: ${index}`)
  }
}
