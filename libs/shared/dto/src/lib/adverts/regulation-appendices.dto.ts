import { Transform } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CaseAddition } from '../cases/case-addition.dto'

/**
 * Upper bound on publication numbers per request. The route is
 * unauthenticated, so this is what keeps the cost of a single call bounded.
 */
export const MAX_REGULATION_APPENDICES_LOOKUP = 100

export class GetRegulationAppendicesQuery {
  @ApiProperty({
    name: 'publicationNumber',
    description: [
      `B-deild publication numbers to look up. Repeat the parameter for each number, at most ${MAX_REGULATION_APPENDICES_LOOKUP} per request; a single occurrence is accepted as a one-item list.`,
      '',
      'Each value must match `^\\d+\\s*/\\s*\\d{4}$` (`number/year`, spaces around the slash allowed) with a serial number of at most 5 digits once leading zeros are dropped, so `01000 / 2026` is `1000/2026`. If any value does not, the whole request is rejected with 400 and the message lists the offending values - validate with the same rule before sending.',
      '',
      'Duplicates (after normalization) are collapsed, and results come back in the order first requested.',
    ].join('\n'),
    type: [String],
    isArray: true,
    required: true,
    example: ['1000/2026', '1001/2026'],
  })
  // A single occurrence of a query parameter arrives as a string, repeated
  // ones as an array.
  @Transform(({ value }) =>
    value === undefined || Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_REGULATION_APPENDICES_LOOKUP)
  @IsString({ each: true })
  publicationNumber!: string[]
}

export class RegulationAppendicesAdvertType {
  @ApiProperty({ type: String, example: 'b-deild-reglugerd' })
  slug!: string

  @ApiProperty({ type: String, example: 'Reglugerð' })
  title!: string
}

export class RegulationAppendicesItem {
  @ApiProperty({
    type: String,
    description:
      'The requested publication number, normalized to `number/year`.',
    example: '1000/2026',
  })
  publicationNumber!: string

  @ApiProperty({
    type: String,
    nullable: true,
    description: [
      'Id of the published B-deild advert, or null when none was found.',
      '',
      'Not found covers both "does not exist" and "not published yet": an advert and its publication number only come into being on publication, so the two cannot be told apart.',
    ].join('\n'),
  })
  advertId!: string | null

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Status of the advert (`Útgefin`, `Afturkölluð`, ...), or null when none was found. Revoked adverts are returned with their appendices.',
  })
  status!: string | null

  @ApiProperty({
    type: RegulationAppendicesAdvertType,
    nullable: true,
    description:
      'Type of the advert. No type filter is applied, so this is how to tell a reglugerð from e.g. a gjaldskrá or auglýsing. Null when none was found.',
  })
  type!: RegulationAppendicesAdvertType | null

  @ApiProperty({
    type: [CaseAddition],
    nullable: true,
    description: [
      'Appendices of the advert in publication order. Always HTML; image sources uploaded through the editor are absolute CDN URLs.',
      '',
      '- `[]`: the advert was published through the case system and has no appendices recorded as such.',
      '- `null`: unknown - the advert was not found, or was published without a case (older adverts), in which case any appendices are part of the advert body.',
      '',
      'Even `[]` cannot rule out an appendix written into the advert body rather than added as an appendix.',
    ].join('\n'),
  })
  appendices!: CaseAddition[] | null
}

export class GetRegulationAppendicesResponse {
  @ApiProperty({
    type: [RegulationAppendicesItem],
    description:
      'One entry per distinct requested publication number, in the order first requested.',
  })
  items!: RegulationAppendicesItem[]
}
