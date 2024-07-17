import { Audit } from '@dmr.is/decorators'
import { GetPdfUrlResponse } from '@dmr.is/shared/dto'

import {
  Controller,
  Get,
  Header,
  HttpException,
  Inject,
  Param,
  StreamableFile,
} from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'

import { caseMigrate } from '../helpers/migrations/case/case-migrate'
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

  @Get('case/:id')
  @ApiOperation({
    operationId: 'getPdfByCaseId',
    summary: 'Get case PDF.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Case PDF.',
    content: {
      'application/pdf': {},
    },
  })
  @Header('Content-Type', 'application/pdf')
  @ApiHeader({
    name: 'Content-Type',
    description: 'application/pdf',
  })
  @Audit()
  async getPdfByCaseId(@Param('id') id: string): Promise<StreamableFile> {
    const result = await this.pdfService.getPdfByCaseId(id)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    const pdf = result.value

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline',
    })
  }

  @Get('application/:id')
  @ApiOperation({
    operationId: 'getPdfByApplicationId',
    summary: 'Get case PDF.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Case PDF.',
    content: {
      'application/pdf': {},
    },
  })
  @Header('Content-Type', 'application/pdf')
  @ApiHeader({
    name: 'Content-Type',
    description: 'application/pdf',
  })
  @Audit()
  async getPdfByApplicationId(
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const result = await this.pdfService.getPdfByCaseId(id)

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.code)
    }

    const pdf = result.value

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline',
    })
  }

  @Get('case/:id/url')
  @ApiOperation({
    operationId: 'getPdfUrlByCaseId',
    summary: 'Get case PDF URL.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Case PDF URL.',
    type: String,
  })
  @Audit()
  async getPdfUrlByCaseId(@Param('id') id: string): Promise<GetPdfUrlResponse> {
    const caseLookup = await this.utilityService.caseLookup(id)

    if (!caseLookup.ok) {
      throw new HttpException(caseLookup.error.message, caseLookup.error.code)
    }

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
  @ApiOperation({
    operationId: 'getPdfUrlByApplicationId',
    summary: 'Get case PDF URL.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Case PDF URL.',
    type: String,
  })
  @Audit()
  async getPdfUrlByApplicationId(
    @Param('id') id: string,
  ): Promise<GetPdfUrlResponse> {
    const caseLookup = await this.utilityService.caseLookupByApplicationId(id)

    if (!caseLookup.ok) {
      throw new HttpException(caseLookup.error.message, caseLookup.error.code)
    }
    const migrated = caseMigrate(caseLookup.value)

    const url =
      process.env.NODE_ENV === 'development'
        ? `http://localhost:${
            process.env.APPLICATION_PORT || 4000
          }/api/v1/pdf/case/${id}`
        : `${process.env.DMR_APPLICATION_API_BASE_PATH}/api/v1/pdf/case/${migrated.id}`

    return {
      url: url,
    }
  }
}
