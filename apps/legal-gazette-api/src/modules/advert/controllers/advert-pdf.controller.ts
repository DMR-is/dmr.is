import { Response } from 'express'

import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { PdfService } from '../../pdf/pdf.service'
import { AdvertModel } from '../advert.model'

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
    const advert = await this.advertModel.unscoped().findByPk(id, {
      attributes: ['id', 'html', 'publishedAt', 'scheduledAt'],
    })

    if (!advert) {
      throw new NotFoundException('Advert not found')
    }

    const pdf = await this.pdfService.generatePdfFromHtml(advert.html)
    const timestamp = new Date(advert.publishedAt ?? advert.scheduledAt)
      .toISOString()
      .replace(/[:.]/g, '-')

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="advert-${advert?.id}-${timestamp}.pdf"`,
      'Content-Length': pdf.length,
    })

    res.send(pdf)
  }
}
