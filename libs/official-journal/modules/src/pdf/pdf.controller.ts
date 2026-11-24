import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { GetPdfBody, GetPdfRespone } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { IPdfService } from './pdf.service.interface'

interface PdfRequest {
  user?: { nationalId?: string; actor?: { nationalId?: string } }
}

/**
 * Renders an application as PDF.
 *
 * Called by island.is on behalf of an applicant
 * (`ojoiApplicationClient.getPdf`). The caller is not a staff user, so this
 * route takes token verification only, not `RoleGuard`. The service then
 * allows only the application's applicant, assignees or applicant actors,
 * matched against the token subject and delegation actor, and answers 404
 * otherwise.
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
    @Req() req: PdfRequest,
  ): Promise<GetPdfRespone> {
    const pdf = (
      await this.pdfService.getPdfByApplicationId(
        id,
        {
          nationalId: req.user?.nationalId,
          actorNationalId: req.user?.actor?.nationalId,
        },
        params.showDate,
      )
    ).unwrap()

    const result = pdf.toString('base64')
    return {
      content: result,
    }
  }
}
