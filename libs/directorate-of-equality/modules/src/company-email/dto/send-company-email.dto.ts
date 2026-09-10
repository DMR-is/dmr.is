import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApiOptionalString, ApiString } from '@dmr.is/decorators'

import { GetCompaniesQueryDto } from '../../company/dto/get-companies-query.dto'

/** Hard caps, shared by the DTO's validation and the service's own checks. */
export const MAX_SUBJECT_LENGTH = 200
export const MAX_BODY_LENGTH = 100_000
export const MAX_ATTACHMENTS = 5

export class CompanyEmailAttachmentInputDto {
  @ApiString({
    description:
      'Staging key returned by the attachment presign endpoint. Validated against the mail-attachment prefix server-side.',
  })
  @IsString()
  @MaxLength(256)
  key!: string

  @ApiString({
    description: 'File name as the recipient should see it.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string
}

/**
 * One admin-authored message plus who it goes to. Shared by the preview and the
 * send so the two cannot be given different inputs and disagree about the
 * result.
 *
 * ⚠️ `companyIds` and `filter` are exclusive and exactly one is required. That
 * is enforced in the service rather than by a decorator, so the rejection can
 * carry the module's own Icelandic message — see `companyEmailMessages`.
 */
export class SendCompanyEmailDto {
  @ApiString({ description: 'Subject line, plain text.' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_SUBJECT_LENGTH)
  subject!: string

  @ApiString({
    description:
      'Message body as HTML from the admin editor. Sanitised server-side before it is stored, previewed or sent.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_BODY_LENGTH)
  bodyHtml!: string

  @ApiProperty({
    type: String,
    isArray: true,
    required: false,
    description:
      'Send to these companies explicitly. Mutually exclusive with `filter`.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  companyIds?: string[]

  @ApiProperty({
    type: GetCompaniesQueryDto,
    required: false,
    description:
      'Send to every company matching this company-list filter. Resolved with the identical query the list itself runs, and deliberately unpaged — `page`/`pageSize` are ignored. Mutually exclusive with `companyIds`.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetCompaniesQueryDto)
  filter?: GetCompaniesQueryDto

  @ApiOptionalString({
    nullable: true,
    description:
      "Override the recipient address for a single-company send, where the admin may correct the company's stored contact email in the compose step. Ignored when more than one company is addressed — there is no one address to override.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  recipientEmail?: string | null

  @ApiProperty({
    type: CompanyEmailAttachmentInputDto,
    isArray: true,
    required: false,
    description: 'Files to attach, previously staged via the presign endpoint.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => CompanyEmailAttachmentInputDto)
  attachments?: CompanyEmailAttachmentInputDto[]
}
