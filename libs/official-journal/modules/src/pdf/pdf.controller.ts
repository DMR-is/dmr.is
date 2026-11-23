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
 * Called by island.is on behalf of an applicant
 * (`ojoiApplicationClient.getPdf`). The caller is not a staff user, so this
 * route takes token verification only, not `RoleGuard`. Further access checks
 * are tracked separately.
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
