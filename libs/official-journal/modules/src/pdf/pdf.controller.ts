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
import {
  GetPdfBody,
  GetPdfRespone,
  GetPdfUrlResponse,
} from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { RoleGuard } from '../guards/auth'
import { IUtilityService } from '../utility/utility.service.interface'
import { IPdfService } from './pdf.service.interface'

/**
 * Renders cases and applications as PDF.
 *
 * These routes carried no guard at all until this commit, which left them
 * reachable unauthenticated on an internet-facing ALB — and neither the case
 * nor the application lookup filters by status, so unpublished and rejected
 * drafts rendered for anyone holding a UUID.
 *
 * The two halves are guarded differently on purpose:
 *
 * - Case routes are staff-only and have no caller, so they take the same
 *   `@Roles(Admin)` stack as `CaseController`.
 * - Application routes are called by island.is on behalf of an *applicant*
 *   (`ojoiApplicationClient.getPdf` → `OJOIAGetPdf`). `RoleGuard` resolves the
 *   caller against the DMR staff user table, so it would reject them; these
 *   get token verification only. That closes anonymous access but not
 *   ownership — any authenticated caller can still fetch any application's PDF
 *   by id. Closing that needs `PartyGuard`, which lives in the application API
 *   and cannot be imported from this lib, so it is a separate change.
 */
@Controller({
  path: 'pdf',
  version: '1',
})
@ApiBearerAuth()
export class PdfController {
  constructor(
    @Inject(IPdfService) private readonly pdfService: IPdfService,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
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

  @Get('case/:id/url')
  @UseGuards(TokenJwtAuthGuard, RoleGuard)
  @Roles(UserRoleEnum.Admin)
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
  @UseGuards(TokenJwtAuthGuard)
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
