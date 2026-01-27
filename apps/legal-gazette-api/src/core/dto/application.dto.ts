import { IsEnum, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'

import { ApplicationStatusEnum } from '../../models/application.model'
import { QueryDto } from './query.dto'

export class GetMyApplicationsQueryDto extends QueryDto {
  @ApiProperty({
    enum: ApplicationTypeEnum,
    enumName: 'ApplicationTypeEnum',
    required: false,
  })
  @IsOptional()
  @IsEnum(ApplicationTypeEnum)
  type?: ApplicationTypeEnum

  @ApiProperty({
    enum: ApplicationStatusEnum,
    enumName: 'ApplicationStatusEnum',
    required: false,
  })
  @IsOptional()
  @IsEnum(ApplicationStatusEnum)
  status?: ApplicationStatusEnum
}
