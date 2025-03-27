import { IsOptional, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateCaseDto {
  @ApiProperty({
    type: String,
  })
  @IsUUID()
  involvedPartyId!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  departmentId!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  typeId!: string

  @ApiProperty({
    type: String,
  })
  @IsString()
  subject!: string
}

export class CreateCaseResponseDto {
  @ApiProperty({
    type: String,
  })
  id!: string
}
