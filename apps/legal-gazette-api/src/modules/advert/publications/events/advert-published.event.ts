import { AdvertDetailedDto } from '../../../../models/advert.model'
import { AdvertPublicationDto } from '../../../../models/advert-publication.model'

export class AdvertPublishedEvent {
  advert!: AdvertDetailedDto
  publication!: AdvertPublicationDto
  html!: string
}
