import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/modules'

import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { getBrowser } from './lib/browser'
import { pdfStyles } from './lib/pdf.css'

const LOGGING_CONTEXT = 'PdfService'
const bucket =
  process.env.LEGAL_GAZETTE_BUCKET || 'legal-gazette-files-bucket-dev'

@Injectable()
export class PdfService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly s3: IAWSService,
    @InjectModel(AdvertPublicationModel)
    readonly advertPublicationModel: typeof AdvertPublicationModel,
  ) {}

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browers = await getBrowser()
    try {
      const page = await browers.newPage()

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      })

      await page.addStyleTag({ content: pdfStyles })

      const pdfBuffer = await page.pdf({
        format: 'A4',
      })

      await browers.close()
      return pdfBuffer
    } catch (error) {
      this.logger.warn('Failed to generate PDF', {
        context: LOGGING_CONTEXT,
        error: error,
      })

      throw error
    } finally {
      await browers.close()
    }
  }

  async generatePdfAndSaveToS3(
    html: string,
    advertId: string,
    publicationId: string,
    title?: string,
  ): Promise<{ s3Url: string; key: string; pdfBuffer: Buffer }> {
    const pdfBuffer = await this.generatePdfFromHtml(
      `${title ? `<head><title>${title}</title></head>` : ''}${html}`,
    )

    const fileName = 'advert.pdf'
    const key = `adverts/${advertId}/${publicationId}/${fileName}`
    const upload = await this.s3.uploadObject(bucket, key, fileName, pdfBuffer)

    if (!upload.result.ok) {
      this.logger.warn('Failed to upload pdf to s3', {
        error: upload.result.error,
        context: LOGGING_CONTEXT,
        key: key,
        upload: upload,
      })
      throw new Error('Failed to upload pdf to s3')
    } else {
      this.logger.debug('PDF generated and saved to S3', {
        context: LOGGING_CONTEXT,
        key: key,
        upload: upload,
      })
    }

    const publication = await this.advertPublicationModel.findOneOrThrow({
      where: { id: publicationId, advertId },
    })

    const url = 'https://files.legal-gazette.dev.dmr-dev.cloud/' + key

    await publication.update({
      pdfUrl: url,
    })

    return {
      s3Url: url,
      key: key,
      pdfBuffer,
    }
  }

  async getPdfFromS3(s3Url: string): Promise<Buffer> {
    const url = new URL(s3Url)
    const key = url.pathname.slice(1)

    const download = await this.s3.getObjectBuffer(key, bucket)

    if (!download.result.ok) {
      this.logger.warn('Failed to download pdf from s3', {
        error: download.result.error,
        context: LOGGING_CONTEXT,
        key: key,
        s3Url,
      })
      throw new Error('Failed to download pdf from s3')
    } else {
      this.logger.debug('Fetching PDF from S3', {
        context: LOGGING_CONTEXT,
        s3Url,
      })
    }

    return download.result.value
  }

  async handleAdvertPdf(
    advertId: string,
    publicationId: string,
    html: string,
    pdfUrl?: string,
    title?: string,
  ): Promise<Buffer> {
    if (pdfUrl) {
      return this.getPdfFromS3(pdfUrl)
    }
    const generatedPdf = await this.generatePdfAndSaveToS3(
      html,
      advertId,
      publicationId,
      title,
    )

    this.logger.debug('Fetching advert PDF', {
      context: LOGGING_CONTEXT,
      advertId: advertId,
    })

    return generatedPdf.pdfBuffer
  }
}
