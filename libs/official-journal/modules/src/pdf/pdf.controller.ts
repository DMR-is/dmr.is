import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { GetPdfBody, GetPdfRespone } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard } from '../guards/auth'
import { IPdfService } from './pdf.service.interface'

/**
 * Renders a case or an application as PDF.
 *
 * Both routes carried no guard at all until this commit, which left them
 * reachable unauthenticated on an internet-facing ALB — and neither lookup
 * filters by status, so unpublished and rejected drafts rendered for anyone
 * holding a UUID.
 *
 * The two are guarded differently on purpose:
 *
 * - The case route is staff-only and has no caller, so it takes the same
 *   `@Roles(Admin)` stack as `CaseController`.
 * - The application route is called by island.is on behalf of an *applicant*
 *   (`ojoiApplicationClient.getPdf` → `OJOIAGetPdf`). `RoleGuard` resolves the
 *   caller against the DMR staff user table, so it would reject them; this one
 *   gets token verification only.
 *
 * That leaves a known residual on the application route: `TokenJwtAuthGuard`
 * checks issuer and signature but not audience or scope, so any token the
 * island.is Identity Server issues to any client is accepted — anyone with an
 * island.is login, not just the applicant. Closing that needs `PartyGuard`
 * semantics, which live in the application API and cannot be imported from
 * this lib. Tracked separately.
 *
 * The two `.../url` companions were deleted rather than guarded: nothing
 * called them, and their only purpose was handing a link to a browser, which
 * cannot send the bearer header these routes now require.
 */
@Controller({
  path: 'pdf',
  version: '1',
})
@ApiBearerAuth()
export class PdfController {
  constructor(
    @Inject(IPdfService) private readonly pdfService: IPdfService,
  ) {}

  @Get('case/:id')
  @UseGuards(TokenJwtAuthGuard, RoleGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ operationId: 'getPdfByCaseId' })
  @ApiResponse({ status: 200, type: GetPdfRespone })
  async getPdfByCaseId(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetPdfRespone> {
    const pdf = (await this.pdfService.generatePdfByCaseId(id)).unwrap()

    const result = pdf.toString('base64')
    return {
      content: result,
    }
  }

  @Get('application/:id')
  @UseGuards(TokenJwtAuthGuard)
  @ApiOperation({ operationId: 'getPdfByApplicationId' })
  @ApiResponse({ status: 200, type: GetPdfRespone })
  async getPdfByApplicationId(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Query() params: GetPdfBody,
  ): Promise<GetPdfRespone> {
    const pdf = (
      await this.pdfService.getPdfByApplicationId(id, params.showDate)
    ).unwrap()

    const result = pdf.toString('base64')
    return {
      content: result,
    }
  }
}
