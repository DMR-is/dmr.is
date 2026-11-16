import { JOB_COUNT_BANDS, type JobCountBand } from '@dmr.is/clients-withholding-tax'
import {
  ApiArray,
  ApiBoolean,
  ApiDateTime,
  ApiDtoArray,
  ApiNationalId,
  ApiNumber,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

export class WithholdingTaxCheckDto {
  @ApiBoolean({ description: 'A fresh token request to Skatturinn succeeded.' })
  ok!: boolean

  @ApiOptionalString({
    nullable: true,
    description:
      'Why it failed: reason, operation and HTTP status. Never a credential.',
  })
  reason!: string | null

  @ApiDateTime()
  checkedAt!: Date
}

export class WithholdingTaxJobCountDto {
  @ApiNumber()
  incomeYear!: number

  @ApiNationalId()
  nationalId!: string

  @ApiOptionalString({ nullable: true })
  name!: string | null

  @ApiOptionalString({ nullable: true })
  legalAddress!: string | null

  @ApiOptionalString({ nullable: true, description: 'Three digits.' })
  postcode!: string | null

  @ApiOptionalString({ nullable: true })
  cityId!: string | null

  @ApiOptionalString({ nullable: true })
  city!: string | null

  @ApiOptionalString({ nullable: true })
  isatCode!: string | null

  @ApiOptionalString({ nullable: true })
  isatText!: string | null

  @ApiString({
    enum: JOB_COUNT_BANDS,
    enumName: 'WithholdingTaxJobCountBand',
    description: 'Average full-time positions (ársverk) over the income year.',
  })
  jobCountBand!: JobCountBand
}

export class WithholdingTaxSkippedRowDto {
  @ApiNumber({ description: 'Position in Skatturinn’s response.' })
  index!: number

  @ApiArray({
    type: [String],
    description: 'Field path and validation code per issue. No values.',
  })
  issues!: string[]
}

export class WithholdingTaxJobCountsDto {
  @ApiNumber()
  incomeYear!: number

  @ApiDtoArray(WithholdingTaxJobCountDto, {
    description:
      'Companies at 25–49 or 50+ average positions. Absence means below 25 or unknown to Skatturinn, not a confirmed 0–24.',
  })
  companies!: WithholdingTaxJobCountDto[]

  @ApiDtoArray(WithholdingTaxSkippedRowDto, {
    description: 'Rows that failed validation and were left out.',
  })
  skipped!: WithholdingTaxSkippedRowDto[]
}
