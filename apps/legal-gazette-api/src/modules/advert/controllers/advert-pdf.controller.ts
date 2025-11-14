import { Response } from 'express'

import { Controller, Get, Inject, Param, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { PdfService } from '../../../services/pdf/pdf.service'
import { IPublicationService } from '../../publications/publication.service.interface'

@Controller({ path: 'adverts/pdf', version: '1' })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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
  async getAdvertPdf(
    @Param('id') id: string,
    @CurrentUser() user: DMRUser,
    @Res() res: Response,
  ) {
    const publications =
      await this.publicationService.getPublishedPublicationsByAdvertId(id)

    const latest = publications[publications.length - 1]

    const publicationId = latest.publication.id
    const publicationPdf = latest.publication.pdfUrl

    const pdf = await this.pdfService.handleAdvertPdf(
      id,
      publicationId,
      latest.html,
      publicationPdf,
      latest.advert.title,
    )

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="advert-${latest.advert.publicationNumber}.pdf"`,
      'Content-Length': pdf.length,
    })

    res.send(pdf)
  }
}
