import { IsOptional, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateAdvertTypeBody {
  @ApiProperty({
    type: String,
    description: 'New title of the advert type',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  mainTypeId?: string
}
