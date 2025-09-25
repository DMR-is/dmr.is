import { AdvertVersionEnum } from '../../advert/advert.model'

export class AdvertPublishedEvent {
  id!: string
  version!: AdvertVersionEnum
}
