import { IsOptional, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCaseBody {
  @ApiProperty({
    description: 'Case id',
    type: String,
    required: true,
    nullable: false,
  })
  @IsUUID()
  readonly caseId!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  readonly applicationId!: string

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
    type: String,
    description: 'Base64 encoded html',
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly advertHtml?: string

  @ApiProperty({
    type: [String],
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly categoryIds?: string[]

  @ApiProperty({
    type: String,
    description: 'Application type: ad, base_regulation, or amending_regulation',
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly applicationType?: string

  @ApiProperty({
    type: String,
    description: 'Regulation draft UUID',
    required: false,
    nullable: true,
  })
  @IsOptional()
  readonly regulationDraftId?: string
}
