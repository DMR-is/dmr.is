import { Expose, Transform } from 'class-transformer'
import { IsBase64, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateCommonAdvertDto } from '../../common-advert/dto/common-advert.dto'

enum CommonApplicationEventsEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class SubmitCommonApplicationDto extends CreateCommonAdvertDto {
  @ApiProperty({ type: String })
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
