import { Transform } from 'class-transformer'
import { IsString } from 'class-validator'

import { ApiOptionalArray } from '@dmr.is/decorators'

export class GetPostcodesQueryDto {
  @ApiOptionalArray({
    type: String,
    isArray: true,
    description:
      'Return only postcodes belonging to one of the given region codes (e.g. "CAPITAL"). Omit for all postcodes.',
  })
  @Transform(({ value }) => {
    if (value == null) return undefined
    return Array.isArray(value) ? value : [value]
  })
  @IsString({ each: true })
  regionCode?: string[]
}
