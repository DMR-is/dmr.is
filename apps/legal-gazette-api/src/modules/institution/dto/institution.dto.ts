import { IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class InstitutionDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  slug!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  nationalId!: string
}
