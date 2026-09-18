import { ApiPropertyOptional } from '@nestjs/swagger'

import { ApiString } from '@dmr.is/decorators'

import { IsatSectionDto } from './isat-section.dto'

export class IsatCategoryDto {
  @ApiString({ description: 'Normalized ÍSAT2008 leaf code, e.g. "01110".' })
  code!: string

  @ApiString({ description: 'Display (dotted) form, e.g. "01.11.0".' })
  codeDotted!: string

  @ApiString({ description: 'Icelandic description.' })
  description!: string

  @ApiString({ description: 'English description.' })
  descriptionEn!: string

  @ApiString({
    description:
      'ÍSAT2008 section (bálkur) letter this leaf rolls up into: "A"–"U", or "X" for unknown activity.',
  })
  section!: string

  @ApiString({
    description: 'ÍSAT2008 division — the 2-digit code prefix, e.g. "01".',
  })
  division!: string

  @ApiPropertyOptional({
    type: IsatSectionDto,
    nullable: true,
    description:
      'The resolved section, when it was joined in. Null when not loaded — read `section` for the letter itself.',
  })
  isatSection!: IsatSectionDto | null
}
