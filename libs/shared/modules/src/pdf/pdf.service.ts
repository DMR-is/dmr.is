import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3'
import { SignatureType, SignatureTypeSlug } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Result, ResultWrapper } from '@dmr.is/types'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { caseMigrate } from '../case/migrations/case.migrate'
import { IUtilityService } from '../utility/utility.module'
import { pdfCss } from './pdf.css'
import { IPdfService } from './pdf.service.interface'
import { getBrowser } from './puppetBrowser'

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
    const applicationLookup = (
      await this.utilityService.applicationLookup(applicationId)
    ).unwrap()

    const { application } = applicationLookup
    const { answers } = application

    const type = (
      await this.utilityService.typeLookup(answers.advert.typeId)
    ).unwrap()

    const { signatureType } = answers.misc

    let signatureHtml = ''

    switch (signatureType) {
      case SignatureType.Committee:
        signatureHtml += answers.signatures.committee?.html
        break
      case SignatureType.Regular:
        signatureHtml += answers.signatures.regular?.map(
          (signature) => signature.html,
        )
        break
    }

    const pdf = (
      await this.generatePdfFromHtml(
        type.title,
        answers.advert.title,
        answers.advert.html,
        signatureHtml,
      )
    ).unwrap()

    return ResultWrapper.ok(pdf)
  }

  @LogAndHandle({ logArgs: false })
  private async generatePdfFromHtml(
    type?: string,
    title?: string,
    advert?: string,
    signature?: string,
  ): Promise<ResultWrapper<Buffer>> {
    const browser = await getBrowser()

    const page = await browser.newPage()

    const pdfTitle = `${type || ''} ${title || ''}`.trim() || 'Untitled'

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="is">
    <head>
      <meta charset="UTF-8">
      <title>${pdfTitle}</title>
      <style>${pdfCss}</style>
    </head>
    <body>
      ${type ? `${type}` : ''}
      ${title ? `${title}` : ''}}
      ${advert ? `${advert}` : ''}}
      ${signature ? `${signature}` : ''}
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
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

    const activeCase = caseMigrate(caseLookup)

    if (!activeCase.publishedAt) {
      const pdf = (
        await this.generatePdfFromHtml(
          activeCase.advertType.title,
          activeCase.advertTitle,
          activeCase.html,
          '', // TODO: Add signature
        )
      ).unwrap()

      return ResultWrapper.ok(pdf)
    }

    const pdf = (
      await this.generatePdfFromHtml(
        activeCase.advertType.title,
        activeCase.advertTitle,
        activeCase.isLegacy
          ? dirtyClean(activeCase.html as HTMLText)
          : activeCase.html,
      )
    ).unwrap()

    return ResultWrapper.ok(pdf)
  }
}
