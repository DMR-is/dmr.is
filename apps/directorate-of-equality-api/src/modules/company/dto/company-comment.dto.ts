import {
  ApiDateTime,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

export class CompanyCommentDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  companyId!: string

  @ApiOptionalUuid({ nullable: true })
  authorUserId!: string | null

  @ApiString({ description: 'Plain text comment body' })
  body!: string

  @ApiDateTime()
  createdAt!: Date
}
