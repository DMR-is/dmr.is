import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Page } from 'puppeteer'
import { Browser } from 'puppeteer'
import { Browser as CoreBrowser } from 'puppeteer-core'
import {
  PDF_RETRY_ATTEMPTS,
  PDF_RETRY_DELAY,
  SignatureType,
} from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ApplicationAttachment } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import {
  applicationSignatureTemplate,
  formatAnyDate,
  handlePdfAdditions,
  retryAsync,
} from '@dmr.is/utils'

import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'

import { cleanupSingleEditorOutput } from '@island.is/regulations-tools/cleanupEditorOutput'
import { HTMLText } from '@island.is/regulations-tools/types'

import { IAWSService } from '../aws/aws.service.interface'
import { caseDetailedMigrate } from '../case/migrations/case-detailed.migrate'
import { IUtilityService } from '../utility/utility.module'
import { pdfCss } from './pdf.css'
import { IPdfService } from './pdf.service.interface'
import { advertPdfTemplate } from './pdf-advert-template'
import { getBrowser } from './puppetBrowser'

const LOGGING_CATEGORY = 'pdf-service'

type PdfBrowser = Browser | CoreBrowser

@Injectable()
export class PdfService implements OnModuleDestroy, IPdfService {
  private browser: PdfBrowser | null = null
  constructor(
    @Inject(IUtilityService)
    private readonly utilityService: IUtilityService,
    @Inject(IAWSService)
    private readonly awsService: IAWSService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async getPdfByApplicationId(
    applicationId: string,
    showDate = true,
  ): Promise<ResultWrapper<Buffer>> {
    const applicationLookup =
      await this.utilityService.applicationLookup(applicationId)

    if (!applicationLookup.result.ok) {
      this.logger.error(
        `Could not find application<${applicationId}>, when trying to generate PDF`,
        {
          category: LOGGING_CATEGORY,
          error: applicationLookup.result.error,
        },
      )
      return ResultWrapper.err({
        code: 404,
        message: 'Application not found',
      })
    }

    const { answers } = applicationLookup.result.value.application
    const signatureType =
      answers.misc?.signatureType === SignatureType.Committee
        ? SignatureType.Committee
        : SignatureType.Regular

    const signatureHtml = applicationSignatureTemplate(
      signatureType === SignatureType.Regular
        ? answers.signature?.regular?.records
        : answers.signature?.committee?.records,
    )

    let additionHtml = ''

    if (answers.advert.additions) {
      additionHtml = answers.advert.additions
        .map((addition) =>
          cleanupSingleEditorOutput(addition.content as HTMLText)
            ? `
            <section class="appendix">
              <h2 class="appendix__title">${addition.title}</h2>
              <div class="appendix__text">
                ${cleanupSingleEditorOutput(addition.content as HTMLText)}
              </div>
            </section>
          `
            : '',
        )
        .join('')
    }

    let markup = advertPdfTemplate({
      title: answers.advert.title,
      type: answers.advert.type.title,
      content: cleanupSingleEditorOutput(answers.advert.html as HTMLText),
      additions: additionHtml,
      signature: signatureHtml,
      hiddenSignature: true,
    })

    if (!showDate) {
      markup = markup + '<style>.signature__date { display: none; }</style>'
    }

    const pdf = (await this.generatePdfFromHtml(markup)).unwrap()

    return ResultWrapper.ok(pdf)
  }

  @LogAndHandle()
  private async getAllCaseAttachments(
    attachments: ApplicationAttachment[],
  ): Promise<string[]> {
    try {
      const urls = await Promise.all(
        attachments.map(async (attachment) => {
          try {
            const fileLocation = attachment.fileLocation
            const signedUrl = (
              await this.awsService.getObject(fileLocation)
            ).unwrap()
            return signedUrl
          } catch (error) {
            this.logger.error(`Failed to get signed URL for attachment`, {
              category: LOGGING_CATEGORY,
              attachment,
              error,
            })
            throw error // rethrow to fail Promise.all
          }
        }),
      )
      return urls
    } catch {
      // Individual errors already logged above
      return []
    }
  }

  @LogAndHandle({ logArgs: false })
  private async mergePdfs(
    mainPdfBuffer: Buffer,
    accompanyingPdfUrls?: string[],
    header?: { dateText?: string; documentNumber?: string },
    footer?: string,
  ): Promise<Buffer> {
    async function fetchPdfFromUrl(url: string): Promise<Uint8Array> {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch PDF from ${url}`)
      return new Uint8Array(await res.arrayBuffer())
    }

    const mergedPdf = await PDFDocument.create()

    const mainDoc = await PDFDocument.load(mainPdfBuffer)
    const mainPages = await mergedPdf.copyPages(
      mainDoc,
      mainDoc.getPageIndices(),
    )
    mainPages.forEach((page) => mergedPdf.addPage(page))

    if (accompanyingPdfUrls && accompanyingPdfUrls.length > 0) {
      for (const url of accompanyingPdfUrls) {
        const pdfBytes = await fetchPdfFromUrl(url)
        const doc = await PDFDocument.load(pdfBytes)
        const pages = await mergedPdf.copyPages(doc, doc.getPageIndices())
        pages.forEach((page) => mergedPdf.addPage(page))
      }
    }

    const pages = mergedPdf.getPages()

    if (header?.dateText && header?.documentNumber) {
      const { dateText, documentNumber } = header

      const font = await mergedPdf.embedFont(StandardFonts.TimesRoman)
      const fontSize = 11
      const margin = 75
      const topOffset = 80
      const textColor = rgb(0.02, 0.02, 0.02)

      const lastPageIndex = pages.length - 1

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const { width, height } = page.getSize()

        page.drawText(documentNumber, {
          x: margin,
          y: height - topOffset,
          size: fontSize,
          font,
          color: textColor,
        })

        const dateWidth = font.widthOfTextAtSize(dateText, fontSize)
        page.drawText(dateText, {
          x: width - margin - dateWidth,
          y: height - topOffset,
          size: fontSize,
          font,
          color: textColor,
        })

        if (i === lastPageIndex && footer) {
          const footerFontSize = 10
          const footerText = footer

          const lineWidth = 60
          const lineX = (width - lineWidth) / 2
          const lineY = 80

          page.drawLine({
            start: { x: lineX, y: lineY },
            end: { x: lineX + lineWidth, y: lineY },
            thickness: 1,
            color: textColor,
          })

          const footerTextWidth = font.widthOfTextAtSize(
            footerText,
            footerFontSize,
          )
          const footerTextX = (width - footerTextWidth) / 2
          const footerTextY = lineY - 20

          page.drawText(footerText, {
            x: footerTextX,
            y: footerTextY,
            size: footerFontSize,
            font,
            color: textColor,
          })
        }
      }
    }

    return Buffer.from(await mergedPdf.save())
  }

  @LogAndHandle({ logArgs: false })
  private async generatePdfFromHtml(
    htmlContent: string,
    caseAttachmentUrls?: string[],
    header?: { dateText: string; documentNumber: string },
    footer?: string,
  ): Promise<ResultWrapper<Buffer>> {
    try {
      return retryAsync(
        async () => {
          if (this.browser === null) {
            this.logger.debug('Creating new browser instance', {
              category: LOGGING_CATEGORY,
            })
            this.browser = await getBrowser()
          }

          const page = await this.browser.newPage()
          await page.setContent(htmlContent)
          await page.addStyleTag({
            content: pdfCss,
          })

          if (header) {
            await (page as Page).evaluate(() => {
              const paragraphs = document.querySelectorAll('p')

              paragraphs.forEach((p) => {
                const parts = p.innerHTML.split('<br>')
                const wrappedParts = parts.map(
                  (text) =>
                    `<span style="text-indent: 2em; display: inline-block;">${text.trim()}</span>`,
                )
                p.innerHTML = wrappedParts.join('<br>')
              })
            })
            const pdf = await page.pdf()
            await page.close()

            const mergedPdf = await this.mergePdfs(
              pdf,
              caseAttachmentUrls,
              header,
              footer,
            )
            await this.browser?.close()
            return ResultWrapper.ok(mergedPdf)
          } else {
            const pdf = await page.pdf()
            await page.close()
            return ResultWrapper.ok(pdf)
          }
        },
        PDF_RETRY_ATTEMPTS,
        PDF_RETRY_DELAY,
      )
    } catch (error) {
      this.logger.error(`Failed to generate PDF`, {
        category: LOGGING_CATEGORY,
        error,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to generate PDF',
      })
    }
  }

  @LogAndHandle()
  async generatePdfByCaseId(
    caseId: string,
    publishedAt?: string,
    serial?: number,
  ): Promise<ResultWrapper<Buffer>> {
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()
    const activeCase = caseDetailedMigrate(caseLookup)
    if (!activeCase.publishedAt && publishedAt) {
      activeCase.publishedAt = publishedAt
    }
    if (!activeCase.publicationNumber && serial) {
      activeCase.publicationNumber = serial.toString()
    }
    const hasAdditions =
      activeCase.attachments.length > 0 || activeCase.additions.length > 0
    const markup = advertPdfTemplate({
      title: activeCase.advertTitle,
      type: activeCase.advertType.title,
      content: cleanupSingleEditorOutput(activeCase.html as HTMLText),
      additions: handlePdfAdditions(activeCase.additions),
      signature: activeCase.signature.html,
      subSignature: hasAdditions
        ? ''
        : activeCase.publishedAt && activeCase.advertDepartment.title
          ? `<div class="sub_signature">${activeCase.advertDepartment.title} - Útgáfudagur: ${formatAnyDate(activeCase.publishedAt)}</div>`
          : undefined,
    })

    const signatureRecords = activeCase.signature.records
    const signatureDate =
      signatureRecords
        .map((item) => item.signatureDate)
        .sort((a, b) => {
          return new Date(b).getTime() - new Date(a).getTime()
        })[0] ?? activeCase.signature.signatureDate

    const newest = signatureDate ?? activeCase.signature.signatureDate

    const header =
      activeCase.publicationNumber && activeCase.signature.signatureDate
        ? {
            dateText: formatAnyDate(newest),
            documentNumber: `Nr. ${activeCase.publicationNumber}`,
          }
        : undefined
    const caseAttachmentsUrls = await this.getAllCaseAttachments(
      activeCase.attachments,
    )
    const pdfResults = await this.generatePdfFromHtml(
      markup,
      caseAttachmentsUrls,
      header,
      hasAdditions
        ? `${activeCase.advertDepartment.title} - Útgáfudagur: ${formatAnyDate(activeCase.publishedAt)}`
        : undefined,
    )

    if (!pdfResults.result.ok) {
      this.logger.error(`Failed to generate PDF`, {
        category: LOGGING_CATEGORY,
        error: pdfResults.result.error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to generate PDF',
      })
    }

    return ResultWrapper.ok(pdfResults.result.value)
  }
}
