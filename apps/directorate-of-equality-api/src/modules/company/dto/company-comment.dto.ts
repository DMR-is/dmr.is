import {
  ApiDateTime,
  ApiOptionalString,
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

  @ApiOptionalString({
    nullable: true,
    description: 'Full name of the admin who authored the comment.',
  })
  authorName!: string | null

  @ApiString({ description: 'Plain text comment body' })
  body!: string

  @ApiDateTime()
  createdAt!: Date
}
