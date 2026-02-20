import { ApiProperty } from '@nestjs/swagger'

import { Department } from '@dmr.is/shared/dto'
export class IssueDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Department })
  department!: Department

  @ApiProperty({ type: Date })
  startDate!: Date

  @ApiProperty({ type: Date })
  endDate!: Date

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  url!: string
}
