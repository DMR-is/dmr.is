import { ApiProperty } from '@nestjs/swagger'

/**
 * Aggregate figures for publication on jafnretti.is.
 *
 * ⚠️ This is the only unauthenticated read in the API, so the shape is a
 * deliberate ceiling rather than a convenience: every field is an aggregate
 * over the register, and nothing here can be narrowed to a company. A field
 * added later that could be is a disclosure, not a feature.
 *
 * The series/points shape mirrors what the island.is chart pipeline consumes
 * (`StatisticSourceData`: a record of key → `{ header, value }[]`), so the
 * client that reads this is a projection rather than a translation.
 *
 * ⚠️ `header` is the MERGE KEY, not a caption. The domain layer combines
 * several `sourceDataKeys` into one chart row by exact string equality on it,
 * so two series meant to sit on the same chart must emit identical headers,
 * point for point and in the same order — otherwise they render as separate
 * unaligned rows instead of merging, which looks like a data problem rather
 * than a formatting one.
 *
 * Five mutually exclusive x-axes are in use here, and only series sharing one
 * may share a chart:
 *
 *   1. AS-OF   a single point keyed on `generatedAt` in ms — every snapshot
 *              figure (`*.obliged`, `*.complied`, `*.percent`, `*.voluntary`,
 *              `salary.employees`, `payGap.raw`, `payGap.oskyrt`).
 *   2. MONTHLY 60 points keyed on each UTC month start in ms — every `*OverTime`
 *              series plus `*.approvals`.
 *   3. SECTOR  five points keyed on the Icelandic sector name — `*BySector.*`.
 *   4. REGION  the landshlutar plus `Óþekkt` — `*ByRegion.*`.
 *   5. SIZE    `25–49` and `50+` — `equalityBySize.*`.
 *
 * `aggregate-statistics.alignment.spec.ts` asserts the three groups internally,
 * so a new series computing its own `new Date()` or its own month range fails
 * the build rather than the chart.
 */

/**
 * `PERCENT` values are fractions (0–1, e.g. `0.011` for 1.1%), not percent
 * points: the island.is chart formatter multiplies by 100 for display.
 *
 * The `payGap.*` figures are SIGNED: positive is a gap í óhag kvenna, negative
 * í óhag karla, so gaps in opposite directions cancel in the mean.
 */
export enum AggregateStatisticUnitEnum {
  COUNT = 'COUNT',
  PERCENT = 'PERCENT',
}

export class AggregateStatisticPointDto {
  @ApiProperty({
    type: String,
    description:
      'X-axis key. Milliseconds since epoch as a string for time series; a stable label (e.g. a sector) otherwise.',
  })
  header!: string

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Null means the figure is not publishable rather than zero — either it could not be computed, or the cohort behind it is too small to publish. A consumer must render it as absent, never as 0.',
  })
  value!: number | null
}

export class AggregateStatisticSeriesDto {
  @ApiProperty({
    type: String,
    description:
      'Stable machine key, e.g. `coverage.covered`. Safe to reference from a CMS chart; the Icelandic label is not.',
  })
  key!: string

  @ApiProperty({ type: String, description: 'Icelandic label for display.' })
  label!: string

  @ApiProperty({
    enum: AggregateStatisticUnitEnum,
    enumName: 'AggregateStatisticUnitEnum',
    description:
      '`PERCENT` values are fractions (0.011 means 1.1%), not percent points. `payGap.*` values are signed: positive means the gap disfavours women, negative men.',
  })
  unit!: AggregateStatisticUnitEnum

  @ApiProperty({ type: [AggregateStatisticPointDto] })
  points!: AggregateStatisticPointDto[]
}

export class AggregateStatisticsDto {
  @ApiProperty({
    type: Date,
    description:
      'When these figures were computed. The register moves continuously, so a published chart without this cannot be reconciled against a later one.',
  })
  generatedAt!: Date

  @ApiProperty({
    type: Number,
    description:
      'Cohort size below which a derived figure is withheld (its `value` is null). Published so a reader can tell a suppressed point from a missing one.',
  })
  minimumCohort!: number

  @ApiProperty({ type: [AggregateStatisticSeriesDto] })
  series!: AggregateStatisticSeriesDto[]
}
