import { ApiProperty, PartialType } from '@nestjs/swagger'

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

class PartialAdvertAnswers extends PartialType(OJOIApplicationAdvert) {}
class PartialMiscAnswers extends PartialType(ApplicationMisc) {}
class PartialSignatureAnswers extends PartialType(OJOIApplicationSignatures) {}

export class OJOIUpdateApplicationAnswers {
  @ApiProperty({
    type: PartialAdvertAnswers,
    description: 'Answers for the advert application',
  })
  advert?: PartialAdvertAnswers

  @ApiProperty({
    type: PartialMiscAnswers,
    description: 'Misc answers',
  })
  misc?: PartialMiscAnswers

  @ApiProperty({
    type: PartialSignatureAnswers,
    description: 'Signature answers',
  })
  signature?: PartialSignatureAnswers
}
