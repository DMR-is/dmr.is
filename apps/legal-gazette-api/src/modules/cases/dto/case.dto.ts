import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateCaseDto {
  @ApiProperty({ type: String })
  @IsUUID()
  typeId!: string

  @ApiProperty({ type: String })
  @IsUUID()
  categoryId!: string
}
