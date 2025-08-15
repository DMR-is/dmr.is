import { Expose, Transform } from 'class-transformer'
import { IsBase64, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommonAdvertDto } from '../../../../advert/common/dto/create-common-advert.dto'

export enum IslandIsCommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class IslandIsSubmitCommonApplicationDto extends CreateCommonAdvertDto {
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
}

export class IslandIsCommonApplicationUpdateStateEventDto {
  @ApiProperty({ type: String })
  @IsUUID()
  applicationId!: string

  @ApiProperty({
    enum: IslandIsCommonApplicationEventsEnum,
    enumName: 'CommonApplicationEvents',
  })
  event!: IslandIsCommonApplicationEventsEnum
}
