import { Type } from 'class-transformer'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAdvert } from './application-advert'
import { ApplicationMisc } from './application-misc'
import { ApplicationSignatures } from './application-signature.dto'

export class ApplicationAnswers {
  @ApiProperty({
    type: ApplicationAdvert,
    description: 'Answers for the advert application',
  })
  @Type(() => ApplicationAdvert)
  advert!: ApplicationAdvert

  @ApiProperty({
    type: ApplicationMisc,
    description: 'Misc answers',
  })
  @Type(() => ApplicationMisc)
  misc?: ApplicationMisc

  @ApiProperty({
    type: ApplicationSignatures,
    description: 'Signature answers',
  })
  @Type(() => ApplicationSignatures)
  signature!: ApplicationSignatures
}
