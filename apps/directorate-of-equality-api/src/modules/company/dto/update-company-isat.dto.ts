import { IsOptional, IsString } from 'class-validator'

import { ApiOptionalString } from '@dmr.is/decorators'

export class UpdateCompanyIsatDto {
  @ApiOptionalString({
    nullable: true,
    description:
      'Normalized ÍSAT2008 leaf code, e.g. "01110". Null clears the classification.',
  })
  @IsOptional()
  @IsString()
  isatCategoryCode!: string | null
}
