import { ApiBoolean, ApiUUID } from '@dmr.is/decorators'

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
}
