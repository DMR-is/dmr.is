import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import {
  CompanyEmailDto,
  CompanyEmailPreviewDto,
  ICompanyEmailService,
  PresignCompanyEmailAttachmentDto,
  SendCompanyEmailDto,
  SendCompanyEmailResponseDto,
} from '@dmr.is/doe-modules/company-email'
import { PresignUploadResponseDto } from '@dmr.is/doe-modules/import-upload'
import { UserModel } from '@dmr.is/doe-modules/user'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'

/**
 * Admin-authored mail to companies.
 *
 * Guarded exactly like `CompanyController` — any active reviewer, EDITOR or
 * ADMIN. Deliberately consistent with the rest of the company surface, where
 * every mutation (fines, quarantine, register status) is open to the same
 * people. Tightening the bulk send to ADMIN is a one-line change here plus an
 * entry in `ADMIN_ONLY_HANDLERS`, if the Directorate later wants that.
 */
@Controller({
  path: 'company-emails',
  version: '1',
})
@ApiTags('Company Emails')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class CompanyEmailController {
  constructor(
    @Inject(ICompanyEmailService)
    private readonly companyEmailService: ICompanyEmailService,
  ) {}

  @Post('attachments/presign')
  @HttpCode(HttpStatus.OK)
  @DoeResponse({
    operationId: 'presignCompanyEmailAttachment',
    type: PresignUploadResponseDto,
    description:
      'Staging target for one attachment. The client PUTs the file to the returned URL, then passes `key` back with the send.',
  })
  async presignAttachment(
    @Body() body: PresignCompanyEmailAttachmentDto,
  ): Promise<PresignUploadResponseDto> {
    return this.companyEmailService.presignAttachment(body)
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @DoeResponse({
    operationId: 'previewCompanyEmail',
    type: CompanyEmailPreviewDto,
    description:
      'Resolve the recipients without writing or sending anything. Returns both the companies that will receive the message and the ones excluded, with the reason — the excluded list is what explains any gap between the count on the button and the count actually written to.',
  })
  async preview(
    @Body() body: SendCompanyEmailDto,
  ): Promise<CompanyEmailPreviewDto> {
    return this.companyEmailService.preview(body)
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @DoeResponse({
    operationId: 'sendCompanyEmail',
    status: HttpStatus.ACCEPTED,
    type: SendCompanyEmailResponseDto,
    description:
      '202, not 200: recipients are resolved and recorded inside the request, and the sending runs after the commit. The returned counts describe what was queued, not what was delivered — a send addressed at the whole register takes minutes, and holding the request open for it would time out and report a false failure for mail that went out. Per-recipient outcomes land on each company timeline.',
  })
  async send(
    @Body() body: SendCompanyEmailDto,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<SendCompanyEmailResponseDto> {
    return this.companyEmailService.send(body, admin.id)
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @DoeResponse({
    operationId: 'getCompanyEmail',
    type: CompanyEmailDto,
    include404: true,
    description:
      'A sent message, read back — backs the company timeline expanding a CUSTOM_EMAIL_* entry into what was actually sent.',
  })
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CompanyEmailDto> {
    return this.companyEmailService.getById(id)
  }
}
