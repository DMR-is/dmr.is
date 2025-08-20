import { IsDateString, IsString } from 'class-validator'

import { ApiProperty, PickType } from '@nestjs/swagger'

export class CreateDivisionMeetingForApplicationDto {
  @ApiProperty({ type: String })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String })
  @IsString()
  meetingLocation!: string
}

export class CreateDivisionEndingMeetingForApplicationDto extends CreateDivisionMeetingForApplicationDto {}

export class CreateRecallAdvertForApplicationDto {
  @ApiProperty({ type: String })
  @IsDateString()
  scheduledAt!: string
}
