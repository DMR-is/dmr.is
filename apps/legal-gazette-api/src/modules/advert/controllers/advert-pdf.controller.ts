import { Response } from 'express'

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import {
  PublicWebScopes,
  TokenJwtAuthGuard,
} from '@dmr.is/ojoi/modules/guards/auth'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { AdvertVersionEnum } from '../../../models/advert-publication.model'
import { PdfService } from '../pdf/pdf.service'
import { IPublicationService } from '../publications/publication.service.interface'

@Controller({ path: 'adverts/pdf', version: '1' })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@PublicWebScopes()
export class AdvertPdfController {
  constructor(
    @Inject(PdfService) private readonly pdfService: PdfService,
    @Inject(IPublicationService)
    private readonly publicationService: IPublicationService,
  ) {}

  @Get(':id')
  @ApiOperation({ operationId: 'getAdvertPdf' })
  @ApiResponse({
    status: 200,
    description: 'Returns the generated pdf as a binary.',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiQuery({ name: 'version', required: false, type: 'string' })
  async getAdvertPdf(
    @Param('id') id: string,
    @Query('version') version: AdvertVersionEnum | undefined,
    @CurrentUser() user: DMRUser,
    @Res() res: Response,
  ) {
    const publication = await this.getPublicationData(id, version)

    const pdf = await this.pdfService.handleAdvertPdf(
      id,
      publication.publicationId,
      publication.html,
      publication.pdfUrl,
      publication.advertTitle,
    )

    this.sendPdfResponse(res, pdf, publication.publicationNumber)
  }

  private async getPublicationData(id: string, version?: AdvertVersionEnum) {
    const publications =
      await this.publicationService.getPublishedPublicationsByAdvertId(id)
    const publication = version
      ? publications.find((p) => p.publication.version === version)
      : publications[publications.length - 1]

    if (!publication) {
      throw new BadRequestException(
        'No published publication found for the given advert and version',
      )
    }

    return {
      publicationId: publication.publication.id,
      html: publication.html,
      pdfUrl: publication.publication.pdfUrl,
      advertTitle: publication.advert.title,
      publicationNumber: publication.advert.publicationNumber,
    }
  }

  private sendPdfResponse(
    res: Response,
    pdf: Buffer,
    publicationNumber: string | undefined,
  ) {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="advert-${publicationNumber}.pdf"`,
      'Content-Length': pdf.length,
    })

    res.send(pdf)
  }
}
