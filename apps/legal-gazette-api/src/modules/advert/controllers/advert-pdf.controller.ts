import { Response } from 'express'

import {
  BadGatewayException,
  Controller,
  Get,
  Inject,
  Param,
  Res,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { PdfService } from '../../pdf/pdf.service'
import { AdvertModel } from '../../../models/advert.model'

@Controller({ path: 'adverts/pdf', version: '1' })
export class AdvertPdfController {
  constructor(
    @Inject(PdfService) private readonly pdfService: PdfService,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
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
  async getAdvertPdf(@Param('id') id: string, @Res() res: Response) {
    const advert = await this.advertModel.findByPkOrThrow(id)

    const publications = advert.publications.filter(
      (pub) => pub.publishedAt !== null,
    )

    if (publications.length === 0 || !advert.publicationNumber) {
      throw new BadGatewayException('Advert is not published')
    }

    const publication = publications[publications.length - 1]
    const publicationId = publication.id
    const version = publication.versionLetter
    const publicationPdf = publication.pdfUrl

    const html = advert.htmlMarkup(version)

    const pdf = await this.pdfService.handleAdvertPdf(
      id,
      publicationId,
      html,
      publicationPdf,
      advert.title,
    )

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="advert-${advert.publicationNumber}.pdf"`,
      'Content-Length': pdf.length,
    })

    res.send(pdf)
  }
}
