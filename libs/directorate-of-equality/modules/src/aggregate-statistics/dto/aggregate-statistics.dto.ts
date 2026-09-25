import { ApiProperty } from '@nestjs/swagger'

import { CompanySizeEnum } from '../../company/models/company.enums'

/**
 * Aggregate figures for the Jafnlaunakerfi dashboard on island.is.
 *
 * ⚠️ This is served without a credential, so the shape is a ceiling rather
 * than a convenience: every field is a count over the register and nothing here
 * names a company. A field added later that could be narrowed to one is a
 * disclosure, not a feature.
 *
 * The endpoint takes no filters. The dashboard's region, size and sector
 * filters are applied by the consumer, which sums the `companies` and `rounds`
 * cells that match. Status and validity round are published as two separate
 * tables, never as one joint cross-tab, so the API discloses no finer grain
 * than the dashboard itself shows.
 */

/**
 * Salary-side status of an ACTIVE company, from what covers it right now.
 *
 * An approved skýrslugjöf filed in this system takes precedence over a legacy
 * certificate, since it is the more recent act.
 */
export enum StatisticsCertificationStatusEnum {
  /** Legacy certificate in force, certified by an accredited body. */
  VOTTUN = 'VOTTUN',
  /** Legacy certificate in force, confirmed by the Directorate. */
  STADFESTING = 'STADFESTING',
  /** Approved skýrslugjöf in force, filed in this system. */
  SKYRSLUGJOF = 'SKYRSLUGJOF',
  /** Legacy certificate in force whose type the old register never recorded. */
  UNCLASSIFIED = 'UNCLASSIFIED',
  /** Nothing on the salary side is in force. */
  NONE = 'NONE',
}

/** Sector buckets. `RADUNEYTI` is folded into `RIKISADILI`, as on the dashboard. */
export enum StatisticsSectorEnum {
  FYRIRTAEKI = 'FYRIRTAEKI',
  RIKISADILI = 'RIKISADILI',
  SVEITARFELAG = 'SVEITARFELAG',
  UNKNOWN = 'UNKNOWN',
}

class StatisticsDimensionsDto {
  @ApiProperty({
    type: String,
    description:
      'Landshluti name, or `Óþekkt` for a company with no postcode. Every region in the reference table is listed in `regions`, including ones with no cells.',
  })
  region!: string

  @ApiProperty({
    enum: CompanySizeEnum,
    enumName: 'StatisticsCompanySizeEnum',
    description:
      'Employee size bucket. MEDIUM (25–49) and LARGE (50+) are the population the law reaches.',
  })
  size!: CompanySizeEnum

  @ApiProperty({
    enum: StatisticsSectorEnum,
    enumName: 'StatisticsSectorEnum',
  })
  sector!: StatisticsSectorEnum
}

export class StatisticsCompanyCellDto extends StatisticsDimensionsDto {
  @ApiProperty({
    enum: StatisticsCertificationStatusEnum,
    enumName: 'StatisticsCertificationStatusEnum',
  })
  status!: StatisticsCertificationStatusEnum

  @ApiProperty({ type: Number, description: 'ACTIVE companies in this cell.' })
  companies!: number
}

export class StatisticsRoundCellDto extends StatisticsDimensionsDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Númer gildistímabils: the legacy register round plus one per approved skýrslugjöf filed since. Null when neither records one.',
  })
  round!: number | null

  @ApiProperty({
    type: Number,
    description:
      'ACTIVE companies in this cell whose salary-side status is not NONE.',
  })
  companies!: number
}

export class StatisticsEmployeesDto {
  @ApiProperty({
    enum: StatisticsCertificationStatusEnum,
    enumName: 'StatisticsCertificationStatusEnum',
  })
  status!: StatisticsCertificationStatusEnum

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Headcount summed over the companies with this status that stated one. Null when fewer than `minimumCohort` companies stand behind it: render as absent, never as 0.',
  })
  employees!: number | null
}

export class AggregateStatisticsDto {
  @ApiProperty({
    type: Date,
    description: 'When these figures were computed. Shown as "Síðast uppfært".',
  })
  generatedAt!: Date

  @ApiProperty({
    type: Date,
    description:
      'When the figures are next recomputed. The response may be cached until then.',
  })
  expiresAt!: Date

  @ApiProperty({
    type: Number,
    description:
      'Fewest companies behind a published headcount. Smaller groups are withheld (null).',
  })
  minimumCohort!: number

  @ApiProperty({
    type: [String],
    description: 'Every region value the cells can carry, in display order.',
  })
  regions!: string[]

  @ApiProperty({ type: [StatisticsCompanyCellDto] })
  companies!: StatisticsCompanyCellDto[]

  @ApiProperty({ type: [StatisticsRoundCellDto] })
  rounds!: StatisticsRoundCellDto[]

  @ApiProperty({
    type: [StatisticsEmployeesDto],
    description:
      'National headcount per status, excluding NONE. Not broken down by region, size or sector: per-cell sums could be subtracted from the total to recover one company.',
  })
  employees!: StatisticsEmployeesDto[]
}
