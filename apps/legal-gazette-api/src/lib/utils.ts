import { AdvertVersionEnum } from '../modules/advert/advert.model'

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
