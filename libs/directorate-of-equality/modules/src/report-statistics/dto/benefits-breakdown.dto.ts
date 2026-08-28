import { ApiDto, ApiNumber, ApiOptionalNumber } from '@dmr.is/decorators'

export class GenderBenefitsDto {
  @ApiNumber()
  averageBonusSalary!: number

  @ApiNumber()
  averageAdditionalSalary!: number

  @ApiNumber()
  averageTotal!: number

  @ApiNumber()
  medianBonusSalary!: number

  @ApiNumber()
  medianAdditionalSalary!: number

  @ApiNumber()
  medianTotal!: number

  @ApiNumber()
  count!: number
}

export class BenefitsBreakdownDto {
  @ApiDto(GenderBenefitsDto)
  male!: GenderBenefitsDto

  @ApiDto(GenderBenefitsDto)
  female!: GenderBenefitsDto

  @ApiDto(GenderBenefitsDto)
  overall!: GenderBenefitsDto

  @ApiOptionalNumber({ nullable: true })
  bonusWageGapPercent!: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalWageGapPercent!: number | null

  @ApiOptionalNumber({ nullable: true })
  totalWageGapPercent!: number | null
}
