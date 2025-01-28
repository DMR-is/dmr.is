import { Route } from '@dmr.is/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { GetPdfRespone, GetPdfUrlResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Inject, Param } from '@nestjs/common'
import {} from '@nestjs/swagger'

import { IUtilityService } from '../utility/utility.service.interface'
import { IPdfService } from './pdf.service.interface'

@Controller({
  path: 'pdf',
  version: '1',
})
export class PdfController {
  constructor(
    @Inject(IPdfService) private readonly pdfService: IPdfService,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
  ) {}

  @Route({
    path: '/case/:id',
    operationId: 'getPdfByCaseId',
    params: [
      {
        name: 'id',
        type: 'string',
        required: true,
      },
    ],
    responseType: GetPdfRespone,
  })
  async getPdfByCaseId(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetPdfRespone> {
    const pdf = (await this.pdfService.generatePdfByCaseId(id)).unwrap()

    const result = pdf.toString('base64')
    return {
      content: result,
    }
  }

  @Route({
    path: 'application/:id',
    operationId: 'getPdfByApplicationId',
    params: [
      {
        name: 'id',
        type: 'string',
        required: true,
      },
    ],
    responseType: GetPdfRespone,
  })
  async getPdfByApplicationId(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetPdfRespone> {
    const pdf = (await this.pdfService.getPdfByApplicationId(id)).unwrap()

    const result = pdf.toString('base64')
    return {
      content: result,
    }
  }

  @Route({
    path: 'case/:id/url',
    operationId: 'getPdfUrlByCaseId',
    params: [
      {
        name: 'id',
        type: 'string',
        required: true,
      },
    ],
    responseType: GetPdfUrlResponse,
  })
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

  @Route({
    path: 'application/:id/url',
    operationId: 'getPdfUrlByApplicationId',
    params: [
      {
        name: 'id',
        type: 'string',
        required: true,
      },
    ],
    responseType: GetPdfUrlResponse,
  })
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
