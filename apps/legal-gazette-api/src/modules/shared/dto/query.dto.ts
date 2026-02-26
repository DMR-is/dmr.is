import { ApiOptionalDateTime, ApiOptionalEnum, ApiOptionalString } from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared-dto'

export enum SortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryDto extends PagingQuery {
  @ApiOptionalString()
  sortBy?: string

  @ApiOptionalEnum(SortDirectionEnum, { enumName: 'SortDirectionEnum' })
  direction?: SortDirectionEnum

  @ApiOptionalDateTime()
  dateFrom?: Date

  @ApiOptionalDateTime()
  dateTo?: Date

  @ApiOptionalString()
  search?: string
}
