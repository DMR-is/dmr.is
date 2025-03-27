import { ApiProperty } from '@nestjs/swagger'

export class CreateMainCategoryCategories {
  @ApiProperty({
    type: [String],
    description: 'Sub categories under this main category',
    required: true,
  })
  categories!: string[]
}
