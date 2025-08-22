import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared/dto'

import { CategoryDto } from '../../category/dto/category.dto'
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

  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto

  @ApiProperty({ type: String })
  title!: string
}

export class ApplicationsDto extends Paging {
  @ApiProperty({ type: [ApplicationDto] })
  applications!: ApplicationDto[]
}
