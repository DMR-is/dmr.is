import { Institution } from '@dmr.is/official-journal/dto'
import { BaseEntity, Paging, PagingQuery } from '@dmr.is/shared/dto'
import { ApiProperty, PickType, PartialType } from '@nestjs/swagger'
import { IsOptional } from 'class-validator'

export class InstitutionDto extends BaseEntity {
  @ApiProperty({
    description: 'National ID of the institution',
    type: String,
  })
  nationalId!: string
}

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

export class CreateInstitution extends PickType(InstitutionDto, ['title']) {
  @ApiProperty({
    required: true,
    type: String,
  })
  nationalId!: string
}

export class UpdateInstitution extends PartialType(CreateInstitution) {}
