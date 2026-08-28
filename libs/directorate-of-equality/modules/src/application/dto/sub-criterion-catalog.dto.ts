import {
  ApiArray,
  ApiDtoArray,
  ApiEnum,
  ApiOptionalNumber,
  ApiString,
} from '@dmr.is/decorators'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'

/** One standard sub-criterion (undirviðmið) offered as a starting point. */
export class SubCriterionCatalogEntryDto {
  @ApiEnum(ReportCriterionTypeEnum, {
    description:
      'Top-level criterion this sub-criterion belongs under. The four job-based types are Jafnréttisstofa-controlled; `PERSONAL` covers the employer-authored ones.',
  })
  criterionType!: ReportCriterionTypeEnum

  @ApiString({
    description:
      'Icelandic Yfirviðmið label as written in the workbook, e.g. `Hæfni` or `Einstaklingsbundinn þáttur`. Several distinct labels map to `PERSONAL`, so this is what to group by for display.',
  })
  parentTitle!: string

  @ApiString()
  title!: string

  @ApiString({ description: 'Skilgreining — what the sub-criterion measures.' })
  description!: string

  @ApiOptionalNumber({
    description:
      'Fjöldi þrepa. Null on entries whose step scale the employer defines — those ship with step 1 only.',
    nullable: true,
  })
  numSteps!: number | null

  @ApiArray({
    type: [String],
    description: 'Step (þrep) descriptions, ordered from step 1.',
  })
  steps!: string[]
}

/**
 * The catalog of standard sub-criteria the salary-report workbook offers in
 * its Undirviðmið dropdown, served so the application portal can offer the
 * same list.
 */
export class GetSubCriterionCatalogResponseDto {
  @ApiDtoArray(SubCriterionCatalogEntryDto)
  entries!: SubCriterionCatalogEntryDto[]

  @ApiArray({
    type: [String],
    description:
      'Generic step wording (`Almennur þrepakvarði`) suggested for sub-criteria with no step descriptions of their own, indexed from step 1. Each entry lists interchangeable phrasings for that step.',
  })
  generalScale!: string[]
}
