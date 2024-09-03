import {
  IsArray,
  IsBooleanString,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseBody {
  @ApiProperty({
    description: 'Case id',
    type: String,
    required: true,
    nullable: false,
  })
  readonly caseId!: string

  @ApiProperty({
    type: String,
    description: 'Title of the application advert',
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly advertTitle?: string

  @ApiProperty({
    type: String,
    description: 'Id of the department',
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly departmentId?: string

  @ApiProperty({
    type: String,
    description: 'Id of the advert type',
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly advertTypeId?: string

  @ApiProperty({
    type: String,
    example: '2021-04-01T00:00:00.000Z',
    description: 'Requested publishing date',
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly requestedPublicationDate?: string

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly message?: string

  @ApiProperty({
    type: [String],
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly categoryIds?: string[]
}
