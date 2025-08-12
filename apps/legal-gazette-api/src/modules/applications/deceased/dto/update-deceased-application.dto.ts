import { ApiProperty, OmitType } from '@nestjs/swagger'

import { UpdateBankruptcyApplicationDto } from '../../bankruptcy/dto/update-bankruptcy-application.dto'

export class UpdateDeceasedApplicationDto extends OmitType(
  UpdateBankruptcyApplicationDto,
  ['settlementDeadline'],
) {
  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  settlementDateOfDeath?: Date | null
}
