import { AdvertDetailedDto } from '../../../../models/advert.dto'
import { AdvertPublicationDto } from '../../../../models/advert-publication.model'

export class AdvertPublishedEvent {
  advert!: AdvertDetailedDto
  publication!: AdvertPublicationDto
  html!: string
}
