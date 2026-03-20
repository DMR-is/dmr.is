import { Type } from 'class-transformer'
import { IsOptional, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAdvert } from './application-advert'
import { ApplicationMisc } from './application-misc'
import { ApplicationSignatures } from './application-signature.dto'

export class ApplicationRegulationReference {
  @ApiProperty({
    type: String,
    description: 'UUID linking to the regulation draft',
  })
  @IsUUID()
  draftId!: string
}

export class ApplicationAnswers {
  @ApiProperty({
    type: String,
    description:
      'Application type: ad, base_regulation, or amending_regulation',
    required: false,
  })
  @IsString()
  @IsOptional()
  applicationType?: string

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

  @ApiProperty({
    type: ApplicationRegulationReference,
    description: 'Regulation reference (for regulation applications)',
    required: false,
  })
  @Type(() => ApplicationRegulationReference)
  @IsOptional()
  regulation?: ApplicationRegulationReference
}
