import { BaseEntity } from '@dmr.is/shared/dto'
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

export class InstitutionDto extends BaseEntity {
  @ApiProperty({
    description: 'National ID of the institution',
    type: String,
  })
  nationalId!: string
}

export class CreateInstitution extends PickType(InstitutionDto, ['title']) {
  @ApiProperty({
    required: true,
    type: String,
  })
  nationalId!: string
}

export class UpdateInstitution extends PartialType(CreateInstitution) {}
