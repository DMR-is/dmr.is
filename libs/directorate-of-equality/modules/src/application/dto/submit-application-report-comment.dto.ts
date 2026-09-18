import { IsNotEmpty, IsString } from 'class-validator'

import { ApiString } from '@dmr.is/decorators'

export class SubmitApplicationReportCommentDto {
  @ApiString({ description: 'Plain text comment body' })
  @IsString()
  @IsNotEmpty()
  body!: string
}
