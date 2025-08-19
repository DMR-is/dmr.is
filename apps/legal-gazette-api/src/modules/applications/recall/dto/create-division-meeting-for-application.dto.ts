import { IsDateString, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CreateDivisionMeetingForApplicationDto {
  @ApiProperty({ type: String })
  @IsDateString()
  meetingDate!: string

  @ApiProperty({ type: String })
  @IsString()
  meetingLocation!: string
}
