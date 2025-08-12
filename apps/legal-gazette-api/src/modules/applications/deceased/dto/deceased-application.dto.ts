import { IsDateString } from 'class-validator'

import { ApiProperty, OmitType } from '@nestjs/swagger'

import { BankruptcyApplicationDto } from '../../bankruptcy/dto/bankruptcy-application.dto'

export class DeceasedApplicationDto extends OmitType(BankruptcyApplicationDto, [
  'settlementDeadline',
]) {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsDateString()
  settlementDateOfDeath?: string
}
