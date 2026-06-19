import { ApiString } from '@dmr.is/decorators'

export class IsatCategoryDto {
  @ApiString({ description: 'Normalized ÍSAT2008 leaf code, e.g. "01110".' })
  code!: string

  @ApiString({ description: 'Display (dotted) form, e.g. "01.11.0".' })
  codeDotted!: string

  @ApiString({ description: 'Icelandic description.' })
  description!: string

  @ApiString({ description: 'English description.' })
  descriptionEn!: string
}
