import { ApiProperty } from '@nestjs/swagger'

export class ForeclosureDto {
  @ApiProperty({ type: String })
  id!: string
}

export class GetForeclosuresDto {
  @ApiProperty({ type: [ForeclosureDto] })
  foreclosures!: ForeclosureDto[]
}
