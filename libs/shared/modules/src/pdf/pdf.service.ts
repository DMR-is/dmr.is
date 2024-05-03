import { readFileSync } from 'fs'
import path from 'path'
import type { Browser } from 'puppeteer'
import puppeteer from 'puppeteer'
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { ICaseService } from '../case/case.service.interface'
import { IPdfService } from './pdf.service.interface'

const LOGGING_CATEGORY = 'PdfService'

@Injectable()
export class PdfService implements IPdfService {
  private browser: Browser | null = null
  private css: Buffer | null = null
  private s3: S3Client | null = null

  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => ICaseService))
    private readonly caseService: ICaseService,
  ) {
    this.logger.info('Using PdfService', {
      category: LOGGING_CATEGORY,
    })
    this.initialize()
  }
  private async generatePdfFromHtml(html: string): Promise<Buffer> {
    if (!this.browser) {
      throw new ServiceUnavailableException()
    }

    this.logger.info(`Generating pdf`, {
      category: LOGGING_CATEGORY,
    })

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${this.css}
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
    `

    await page.setContent(htmlTemplate)
    const pdf = await page.pdf()

    await browser.close()

    return pdf
  }

  private async uploadPdfToS3(pdf: Buffer, caseId: string) {
    this.logger.info(`Uploading pdf to S3 for advert ${caseId}`, {
      caseId,
      category: LOGGING_CATEGORY,
    })
    // Upload pdf to S3

    if (!this.s3) {
      this.logger.warn('S3 client not initialized', {
        category: LOGGING_CATEGORY,
      })
      return
    }

    const bucket = process.env.AWS_BUCKET_NAME

    if (!bucket) {
      this.logger.warn('AWS_BUCKET_NAME not found', {
        category: LOGGING_CATEGORY,
      })
      return
    }

    const key = `case-${caseId}.pdf`

    try {
      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: `case-${caseId}.pdf`,
        Body: pdf,
        PartNumber: 1,
        UploadId: 'uploadId',
      })

      await this.s3.send(command)
      const url = `https://${bucket}.s3.amazonaws.com/pdf/${key}`
    } catch (e) {
      this.logger.error('Failed to upload pdf to S3', {
        category: LOGGING_CATEGORY,
        error: e,
      })
    }
  }

  async getCasePdf(caseId: string): Promise<Buffer> {
    this.logger.info(`Getting pdf for advert ${caseId}`, {
      caseId,
      category: LOGGING_CATEGORY,
    })

    const theCase = await this.caseService.getCase(caseId)

    if (!theCase) {
      this.logger.warn(`Case ${caseId} not found`, {
        caseId,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException()
    }

    const document =
      theCase.history[theCase.history.length - 1].answers.preview?.document

    if (!document) {
      this.logger.warn(`Document not found for case ${caseId}`, {
        caseId,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException()
    }

    const pdf = await this.generatePdfFromHtml(
      theCase.isLegacy ? dirtyClean(document as HTMLText) : document,
    )
    return pdf
  }

  private async initialize() {
    this.browser = await puppeteer.launch()
    this.css = readFileSync(path.join(__dirname, '/pdf.css'))

    const accessKey = process.env.AWS_ACCESS_KEY_ID ?? ''
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? ''

    if (!accessKey || !secretAccessKey) {
      this.logger.error('AWS credentials not found', {
        category: LOGGING_CATEGORY,
      })
    } else {
      this.logger.info('Initalizing S3 client', {
        category: LOGGING_CATEGORY,
      })
      this.s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretAccessKey,
        },
      })
    }

    this.logger.info('Puppeteer browser initialized', {
      category: LOGGING_CATEGORY,
    })
  }
}
