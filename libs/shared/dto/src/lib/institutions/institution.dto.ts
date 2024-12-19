import { IsOptional } from 'class-validator'

import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

import { BaseEntity } from '../entity'
import { Paging, PagingQuery } from '../paging'

export class Institution {
  @ApiProperty({
    description: 'Unique ID for the institution, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the institution',
    example: 'Dómsmálaráðuneytið',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Slug of the institution, used in URLs and API requests.',
    example: 'domsmalaraduneytid',
    required: true,
    type: String,
  })
  readonly slug!: string
}

export class InstitutionDto extends BaseEntity {}

export class GetInstitution {
  @ApiProperty({
    type: Institution,
  })
  institution!: InstitutionDto
}

export class GetInstitutions {
  @ApiProperty({
    type: [Institution],
  })
  institutions!: InstitutionDto[]

  @ApiProperty({
    type: Paging,
  })
  paging!: Paging
}

export class InstitutionQuery extends PagingQuery {
  @ApiProperty({
    required: false,
    type: String,
  })
  @IsOptional()
  search?: string
}

export class CreateInstitution extends PickType(InstitutionDto, ['title']) {}

export class UpdateInstitution extends PartialType(CreateInstitution) {}
