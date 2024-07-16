import type { Browser } from 'puppeteer'
import puppeteer from 'puppeteer'
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3'
import { Audit, HandleException } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { GetCasePdfResponse } from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { IUtilityService } from '../utility/utility.service.interface'
import { pdfCss } from './pdf.css'
import { IPdfService } from './pdf.service.interface'

@Injectable()
export class PdfService implements IPdfService {
  private browser: Browser | null = null
  private s3: S3Client | null = null

  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUtilityService)
    private readonly utilityService: IUtilityService,
  ) {
    this.initialize()
  }

  @Audit({ logArgs: false })
  @HandleException()
  private async generatePdfFromHtml(html: string): Promise<Result<Buffer>> {
    if (!this.browser) {
      throw new ServiceUnavailableException()
    }

    const page = await this.browser.newPage()

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      ${html}
    </body>
    </html>
    `
    await page.setContent(htmlTemplate)
    await page.addStyleTag({ content: pdfCss })

    const pdf = await page.pdf()

    await this.browser.close()

    return {
      ok: true,
      value: pdf,
    }
  }

  @Audit()
  @HandleException()
  private async uploadPdfToS3(
    pdf: Buffer,
    caseId: string,
  ): Promise<Result<undefined>> {
    if (!this.s3) {
      throw new InternalServerErrorException('S3 client not initialized')
    }

    const bucket = process.env.AWS_BUCKET_NAME

    if (!bucket) {
      throw new InternalServerErrorException('AWS_BUCKET_NAME not set')
    }

    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: `case-${caseId}.pdf`,
      Body: pdf,
      PartNumber: 1,
      UploadId: 'uploadId',
    })

    await this.s3.send(command)

    return {
      ok: true,
      value: undefined,
    }
  }

  @Audit()
  @HandleException()
  async getCasePdf(caseId: string): Promise<Result<GetCasePdfResponse>> {
    const caseLookup = await this.utilityService.getCaseWithAdvert(caseId)

    if (!caseLookup.ok) {
      return caseLookup
    }

    const { activeCase, advert } = caseLookup.value

    if (!activeCase.publishedAt) {
      const pdf = await this.generatePdfFromHtml(advert.documents.full)

      if (!pdf.ok) {
        return pdf
      }

      return {
        ok: true,
        value: {
          url: `data:application/pdf;base64,${pdf.value.toString('base64')}`,
          pdf: pdf.value,
        },
      }
    }

    const pdf = await this.generatePdfFromHtml(
      activeCase.isLegacy
        ? dirtyClean(advert.documents.full as HTMLText)
        : advert.documents.full,
    )

    if (!pdf.ok) {
      return pdf
    }

    return {
      ok: true,
      value: { pdf: pdf.value, url: '' },
    }
  }

  @Audit()
  private async initialize() {
    this.browser = await puppeteer.launch()

    const accessKey = process.env.AWS_ACCESS_KEY_ID ?? ''
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? ''

    if (!accessKey || !secretAccessKey) {
      throw new InternalServerErrorException('Missing environment variables')
    }

    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
      },
    })
  }
}
