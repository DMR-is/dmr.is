import { ApiProperty } from '@nestjs/swagger'

import { IssueSettingsDto } from '../../../../models/issues-settings.model'

export class GetIssueSettingsDto {
  @ApiProperty({
    type: IssueSettingsDto,
  })
  issueSettings!: IssueSettingsDto
}
