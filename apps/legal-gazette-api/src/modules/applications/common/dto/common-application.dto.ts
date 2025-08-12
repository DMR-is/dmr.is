import { Expose, Transform, Type } from 'class-transformer'
import {
  IsBase64,
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommonAdvertDto } from '../../../advert/common/dto/create-common-advert.dto'

enum CommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class SubmitCommonApplicationOwnerDto {
  @ApiProperty({ type: String })
  @IsString()
  name!: string

  @ApiProperty({ type: String, required: false })
  @IsString()
  nationalId!: string
}

export class SubmitCommonApplicationDto extends CreateCommonAdvertDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  applicationId!: string

  @ApiProperty({ type: String })
  @IsBase64()
  htmlBase64!: string

  @Expose()
  @IsString()
  @Transform(({ obj }) =>
    Buffer.from(obj.htmlBase64, 'base64').toString('utf-8'),
  )
  html!: string

  @ApiProperty({ type: SubmitCommonApplicationOwnerDto, required: true })
  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => SubmitCommonApplicationOwnerDto)
  actor!: SubmitCommonApplicationOwnerDto

  @ApiProperty({ type: SubmitCommonApplicationOwnerDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SubmitCommonApplicationOwnerDto)
  institution?: SubmitCommonApplicationOwnerDto
}

export class CommonApplicationUpdateStateEvent {
  @ApiProperty({ type: String })
  @IsUUID()
  applicationId!: string

  @ApiProperty({
    enum: CommonApplicationEventsEnum,
    enumName: 'CommonApplicationEvents',
  })
  event!: CommonApplicationEventsEnum
}
