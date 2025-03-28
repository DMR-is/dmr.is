import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { IPdfService } from './pdf.service.interface'
import { GetPdfUrlResponse } from './dto/get-case-pdf-response.dto'
import { GetPdfRespone, GetPdfBody } from './dto/get-pdf-response.dto'
import { IUtilityService } from '@dmr.is/official-journal/modules/utility'

@Controller({
  path: 'pdf',
  version: '1',
})
export class PdfController {
  constructor(
    @Inject(IPdfService) private readonly pdfService: IPdfService,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
  ) {}

  @Get('case/:id')
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

  @Get('case/:id/url')
  @ApiOperation({ operationId: 'getPdfUrlByCaseId' })
  @ApiResponse({ status: 200, type: GetPdfUrlResponse })
  async getPdfUrlByCaseId(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetPdfUrlResponse> {
    ResultWrapper.unwrap(await this.utilityService.caseLookup(id))

    const url =
      process.env.NODE_ENV === 'development'
        ? `http://localhost:${
            process.env.APPLICATION_PORT || 4000
          }/api/v1/pdf/case/${id}`
        : `${process.env.DMR_APPLICATION_API_BASE_PATH}/api/v1/pdf/case/${id}`

    return {
      url: url,
    }
  }

  @Get('application/:id/url')
  @ApiOperation({ operationId: 'getPdfUrlByApplicationId' })
  @ApiResponse({ status: 200, type: GetPdfUrlResponse })
  async getPdfUrlByApplicationId(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetPdfUrlResponse> {
    const applicationLookup = (
      await this.utilityService.applicationLookup(id)
    ).unwrap()

    const url =
      process.env.NODE_ENV === 'development'
        ? `http://localhost:${
            process.env.APPLICATION_PORT || 5555
          }/api/v1/pdf/case/${id}`
        : `${
            process.env.DMR_PDF_BASE_PATH ||
            'https://application-api.official-journal.dev.dmr-dev.cloud'
          }/api/v1/pdf/application/${applicationLookup.application.id}`

    return {
      url: url,
    }
  }
}
