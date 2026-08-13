import { ApiString } from '@dmr.is/decorators'

export class IsatSectionDto {
  @ApiString({
    description:
      'ÍSAT2008 section (bálkur) letter: "A"–"U", or "X" for unknown activity.',
  })
  code!: string

  @ApiString({ description: 'Icelandic description.' })
  description!: string

  @ApiString({ description: 'English description.' })
  descriptionEn!: string
}
