import puppeteer from 'puppeteer'
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3'
import { LogAndHandle, LogMethod } from '@dmr.is/decorators'
import { Result, ResultWrapper } from '@dmr.is/types'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { IUtilityService } from '../utility/utility.module'
import { pdfCss } from './pdf.css'
import { IPdfService } from './pdf.service.interface'

@Injectable()
export class PdfService implements IPdfService {
  private s3: S3Client | null = null

  constructor(
    @Inject(IUtilityService)
    private readonly utilityService: IUtilityService,
  ) {}

  async getPdfByApplicationId(
    applicationId: string,
  ): Promise<ResultWrapper<Buffer>> {
    const caseLookup = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    const migrated = caseMigrate(caseLookup)

    const theCase = (
      await this.utilityService.getCaseWithAdvert(migrated.id)
    ).unwrap()

    const { activeCase, advert } = theCase

    if (!activeCase.publishedAt) {
      const pdf = (
        await this.generatePdfFromHtml(advert.title, advert.documents.full)
      ).unwrap()

      return ResultWrapper.ok(pdf)
    }

    const pdf = (
      await this.generatePdfFromHtml(
        advert.title,
        activeCase.isLegacy
          ? dirtyClean(advert.documents.full as HTMLText)
          : advert.documents.full,
      )
    ).unwrap()

    return ResultWrapper.ok(pdf)
  }

  @LogAndHandle({ logArgs: false })
  private async generatePdfFromHtml(
    title: string,
    html: string,
  ): Promise<ResultWrapper<Buffer>> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--font-render-hinting=none'],
    })

    const page = await browser.newPage()

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="is">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>${pdfCss}</style>
    </head>
    <body>
      ${html}
    </body>
    </html>
    `
    await page.setContent(htmlTemplate)

    const pdf = await page.pdf()

    await browser.close()

    return ResultWrapper.ok(pdf)
  }

  @LogAndHandle()
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

  @LogAndHandle()
  async getPdfByCaseId(caseId: string): Promise<ResultWrapper<Buffer>> {
    const caseLookup = (
      await this.utilityService.getCaseWithAdvert(caseId)
    ).unwrap()

    const { activeCase, advert } = caseLookup

    const document = advert.documents.full

    if (!activeCase.publishedAt) {
      const pdf = (
        await this.generatePdfFromHtml(advert.title, document)
      ).unwrap()

      return ResultWrapper.ok(pdf)
    }

    const pdf = (
      await this.generatePdfFromHtml(
        advert.title,
        activeCase.isLegacy
          ? dirtyClean(advert.documents.full as HTMLText)
          : advert.documents.full,
      )
    ).unwrap()

    return ResultWrapper.ok(pdf)
  }

  @LogMethod()
  private async initialize() {
    const accessKey = process.env.AWS_ACCESS_KEY_ID ?? ''
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? ''

    if (!accessKey || !secretAccessKey) {
      // eslint-disable-next-line no-console
      console.log('Missing environment variables')
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
