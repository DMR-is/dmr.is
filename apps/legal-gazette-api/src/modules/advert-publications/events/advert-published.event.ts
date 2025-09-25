import { AdvertModel } from '../../advert/advert.model'
import { AdvertPublicationModel } from '../advert-publication.model'

export class AdvertPublishedEvent {
  advert!: AdvertModel
  publication!: AdvertPublicationModel
}
