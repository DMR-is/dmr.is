import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, Validate } from 'class-validator'

export class CaseNumber {
  @ApiProperty({
    type: Number,
    example: 2024,
  })
  @IsNumber()
  @Validate((value: number) => value > 999 && value < 10000)
  year!: string

  @ApiProperty({
    type: Number,
    example: 253,
  })
  @IsNumber()
  number!: number

  @ApiProperty({
    type: String,
    example: '253/2024',
  })
  full!: string
}
