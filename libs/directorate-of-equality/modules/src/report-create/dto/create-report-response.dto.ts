import {
  ApiBoolean,
  ApiEnum,
  ApiOptionalArray,
  ApiUUID,
} from '@dmr.is/decorators'

import { ReportStatusEnum } from '../../report/models/report.enums'

export class CreateReportResponseDto {
  @ApiUUID({ description: 'Identifier of the newly created report row.' })
  reportId!: string

  /**
   * `true` when this call filed nothing: the `providerId` was already used, so
   * the report named above is the one that submission created earlier and the
   * body just sent was **not** read at all — not validated, not compared, not
   * stored.
   *
   * Distinguishing this from a real submission is what makes a retry safe to
   * repeat and a *correction* safe to trust. The replay check runs before every
   * other rule in the creation path, so a caller that re-files a corrected
   * report under the same `providerId` gets the id of the report it was trying
   * to replace, and a follow-up read by provider id returns that same report —
   * every signal agreeing that a correction landed when nothing did. A
   * correction needs a new `providerId`; this flag is how a caller notices it
   * used an old one.
   */
  @ApiBoolean({
    description:
      'True when the providerId had already been used and this call filed nothing — the report named here is the earlier one, and the body just sent was not read. A corrected re-file needs a new providerId.',
  })
  replayed!: boolean

  /**
   * What the report is now, which a caller cannot always predict from what it
   * sent.
   *
   * A submission with unexplained outliers files as `POSTPONED` rather than
   * `SUBMITTED` on a channel that asked for that (see
   * `CreateReportDto.postponeUnexplainedOutliers`), and whether that happened
   * depends on detection the caller never ran. On a replay this is the status of
   * the report the earlier call filed, which may since have moved on.
   */
  @ApiEnum(ReportStatusEnum, {
    description:
      'Status of the report this call refers to. SUBMITTED means it is in the reviewer queue; POSTPONED means outliers were detected and left unexplained, and it cannot be reviewed until they are.',
  })
  status!: ReportStatusEnum

  /**
   * The employee ordinals still owed an explanation, present only when `status`
   * is `POSTPONED` and this call filed the report.
   *
   * These are the ordinals as the caller sent them, so a payroll system can map
   * them straight back to its own rows without a second lookup. It is the
   * detected set — not a page of it — because the caller has to cover every one
   * of them to complete the filing, and a partial answer would be worse than
   * none. `GET …/:providerId/outliers` serves the same set with the employee
   * rows attached, for recovering it after this response is gone.
   *
   * Absent on a replay: that call filed nothing and read nothing, so it has no
   * detection to report.
   */
  @ApiOptionalArray({
    type: [Number],
    description:
      'Employee ordinals whose pay difference is unexplained, present only when status is POSTPONED. Every one of them must be covered by a group sent to PUT …/outliers before the report can be reviewed.',
  })
  unexplainedOutlierOrdinals?: number[]
}
