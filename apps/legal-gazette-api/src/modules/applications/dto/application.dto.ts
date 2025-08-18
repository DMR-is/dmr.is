import { ApiProperty } from '@nestjs/swagger'

import { ApplicationTypeEnum } from '../../../lib/constants'
import { ApplicationStatusEnum } from '../contants'

export class ApplicationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  caseId!: string

  @ApiProperty({ type: String })
  nationalId!: string

  @ApiProperty({ enum: ApplicationStatusEnum })
  status!: ApplicationStatusEnum

  @ApiProperty({ enum: ApplicationTypeEnum, enumName: 'ApplicationTypeEnum' })
  applicationType!: ApplicationTypeEnum

  @ApiProperty({ type: String })
  title!: string
}

export class ApplicationsDto {
  @ApiProperty({ type: [ApplicationDto] })
  applications!: ApplicationDto[]
}
