import { Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

import { ApiOptionalArray, ApiOptionalString } from '@dmr.is/decorators'

export class SearchIsatCategoriesQueryDto {
  @ApiOptionalString({
    description:
      'Free-text search on ÍSAT code or description (Icelandic/English). Returns the top matches.',
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Resolve these exact ÍSAT leaf codes — used to label an existing selection. Takes precedence over `q`.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  codes?: string[]
}
