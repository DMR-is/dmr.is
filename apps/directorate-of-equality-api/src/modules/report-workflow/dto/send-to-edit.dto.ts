import { IsNotEmpty, IsString } from 'class-validator'

import { ApiString } from '@dmr.is/decorators'

/**
 * Reviewer request to send a report back to the applicant for changes. The
 * reason is posted as an external comment (visible to the applicant) in the
 * same action, so the applicant always sees why they were asked to edit.
 */
export class SendToEditDto {
  @ApiString()
  @IsString()
  @IsNotEmpty()
  reason!: string
}
