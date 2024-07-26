import { Route } from '@dmr.is/decorators'
import { GetPdfUrlResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Inject, Param, StreamableFile } from '@nestjs/common'

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
    path: 'pdf/case/:id',
    operationId: 'getPdfByCaseId',
    params: [
      {
        name: 'id',
        type: 'string',
        required: true,
      },
    ],
    responseType: StreamableFile,
  })
  async getPdfByCaseId(@Param('id') id: string): Promise<StreamableFile> {
    const pdf = (await this.pdfService.getPdfByCaseId(id)).unwrap()

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline',
    })
  }

  @Route({
    path: 'pdf/application/:id',
    operationId: 'getPdfByApplicationId',
    params: [
      {
        name: 'id',
        type: 'string',
        required: true,
      },
    ],
    responseType: StreamableFile,
  })
  async getPdfByApplicationId(
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const pdf = (await this.pdfService.getPdfByApplicationId(id)).unwrap()

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline',
    })
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
  async getPdfUrlByCaseId(@Param('id') id: string): Promise<GetPdfUrlResponse> {
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
    @Param('id') id: string,
  ): Promise<GetPdfUrlResponse> {
    const caseLookup = (
      await this.utilityService.caseLookupByApplicationId(id)
    ).unwrap()

    const url =
      process.env.NODE_ENV === 'development'
        ? `http://localhost:${
            process.env.APPLICATION_PORT || 4000
          }/api/v1/pdf/case/${id}`
        : `${process.env.DMR_APPLICATION_API_BASE_PATH}/api/v1/pdf/case/${caseLookup.id}`

    return {
      url: url,
    }
  }
}
