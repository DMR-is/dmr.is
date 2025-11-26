import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class IssueDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the issue was created',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: string

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'The date and time when the issue was published',
  })
  @IsDateString()
  publishDate!: string

  @ApiProperty({ type: String })
  @IsString()
  title!: string

  @ApiProperty({ type: String })
  @IsString()
  url!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  issue!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  year!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  runningPageNumber!: number
}

export class GetIssuesDto {
  @ApiProperty({
    type: [IssueDto],
  })
  issues!: IssueDto[]
}
