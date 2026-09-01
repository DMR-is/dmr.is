import {
  ApiBoolean,
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

  @ApiBoolean({
    description:
      'True when the system wrote the comment rather than a person — render it as "Kerfið", not as an unnamed member of staff. Distinct from `authorName` being null, which only means no user is attached.',
  })
  isSystem!: boolean

  @ApiDateTime()
  createdAt!: Date
}
