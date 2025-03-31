import { ApiProperty } from '@nestjs/swagger'

import { OJOIApplicationAdvert } from './application-advert.dto'
import { ApplicationMisc } from './application-misc'
import { OJOIApplicationSignatures } from './application-signature.dto'

export class OJOIApplicationAnswers {
  @ApiProperty({
    type: OJOIApplicationAdvert,
    description: 'Answers for the advert application',
  })
  advert!: OJOIApplicationAdvert

  @ApiProperty({
    type: ApplicationMisc,
    description: 'Misc answers',
  })
  misc?: ApplicationMisc

  @ApiProperty({
    type: OJOIApplicationSignatures,
    description: 'Signature answers',
  })
  signature!: OJOIApplicationSignatures
}
