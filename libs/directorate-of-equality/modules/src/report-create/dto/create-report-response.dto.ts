import { ApiUUID } from '@dmr.is/decorators'

export class CreateReportResponseDto {
  @ApiUUID({ description: 'Identifier of the newly created report row.' })
  reportId!: string
}
