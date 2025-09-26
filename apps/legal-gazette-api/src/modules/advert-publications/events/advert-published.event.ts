import { AdvertDetailedDto } from '../../advert/dto/advert.dto'
import { AdvertPublicationDto } from '../dto/advert-publication.dto'

export class AdvertPublishedEvent {
  advert!: AdvertDetailedDto
  publication!: AdvertPublicationDto
}
