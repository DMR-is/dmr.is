import { AdvertPublicationDto } from '../../../models/advert-publication.model'
import { AdvertDetailedDto } from '../../advert/dto/advert.dto'

export class AdvertPublishedEvent {
  advert!: AdvertDetailedDto
  publication!: AdvertPublicationDto
  html!: string
}
