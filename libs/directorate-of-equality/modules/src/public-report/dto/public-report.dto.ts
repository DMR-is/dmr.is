import { ApiDateTime, ApiString, ApiUUId } from '@dmr.is/decorators'

export class PublicReportDto {
  @ApiUUId()
  id!: string

  @ApiString()
  sizeBucket!: string

  @ApiString()
  isatCategory!: string

  @ApiDateTime()
  publishedAt!: Date

  @ApiDateTime()
  validUntil!: Date
}
