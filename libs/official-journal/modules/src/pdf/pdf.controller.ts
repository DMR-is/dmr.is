import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { GetPdfBody, GetPdfRespone } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { IPdfService } from './pdf.service.interface'

/**
 * Renders an application as PDF.
 *
 * Called by island.is on behalf of an *applicant*
 * (`ojoiApplicationClient.getPdf` → `OJOIAGetPdf`). `RoleGuard` resolves the
 * caller against the DMR staff user table, so it would reject them; this route
 * gets token verification only. The lookup does not filter by status, which is
 * why it must never be left unguarded.
 *
 * Known residual: `TokenJwtAuthGuard` checks issuer and signature but not
 * audience or scope, so any token the island.is Identity Server issues to any
 * client is accepted — anyone with an island.is login, not just the applicant.
 * Closing that needs `PartyGuard` semantics, which live in the application API
 * and cannot be imported from this lib. Tracked separately.
 *
 * The staff-only `GET pdf/case/:id` and the two `.../url` companions were
 * deleted rather than kept: nothing called them.
 */
@Controller({
  path: 'pdf',
  version: '1',
})
@ApiBearerAuth()
export class PdfController {
  constructor(@Inject(IPdfService) private readonly pdfService: IPdfService) {}

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
