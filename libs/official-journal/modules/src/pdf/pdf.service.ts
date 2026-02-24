import { dirname, join } from 'node:path'
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib'

import { Inject, Injectable } from '@nestjs/common'

import {
  CHROME_USER_AGENT,
  PDF_RETRY_ATTEMPTS,
  PDF_RETRY_DELAY,
  SignatureType,
} from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { HTMLText } from '@dmr.is/regulations-tools/types'
import { ResultWrapper } from '@dmr.is/types'
import { simpleSanitize } from '@dmr.is/utils/server/cleanLegacyHtml'
import {
  applicationSignatureTemplate,
  formatAnyDate,
  handlePdfAdditions,
  retryAsync,
} from '@dmr.is/utils/server/serverUtils'

import { caseDetailedMigrate } from '../case/migrations/case-detailed.migrate'
import { IUtilityService } from '../utility/utility.module'
import { pdfCss } from './pdf.css'
import { IPdfService, IssuePdfAdvertInput } from './pdf.service.interface'
import { advertPdfTemplate } from './pdf-advert-template'
import { getBrowser } from './puppetBrowser'

const LOGGING_CATEGORY = 'pdf-service'

@Injectable()
export class PdfService implements IPdfService {
  private cachedPdfJs: any | null = null

  constructor(
    @Inject(IUtilityService)
    private readonly utilityService: IUtilityService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  private getPdfJsLegacy(): any {
    if (this.cachedPdfJs) {
      return this.cachedPdfJs
    }

    const errors: string[] = []

    try {
      const reactPdfEntry = require.resolve('react-pdf')
      const reactPdfRoot = join(dirname(reactPdfEntry), '..', '..')
      const nestedPdfJsPath = join(
        reactPdfRoot,
        'node_modules',
        'pdfjs-dist',
        'legacy',
        'build',
        'pdf.js',
      )
      this.cachedPdfJs = require(nestedPdfJsPath)
      return this.cachedPdfJs
    } catch (error: any) {
      errors.push(
        `react-pdf nested pdfjs failed: ${String(error?.message ?? error)}`,
      )
    }

    try {
      this.cachedPdfJs = require('pdfjs-dist/legacy/build/pdf.js')
      return this.cachedPdfJs
    } catch (error: any) {
      errors.push(`top-level pdfjs failed: ${String(error?.message ?? error)}`)
    }

    throw new Error(`Unable to load pdfjs legacy build. ${errors.join(' | ')}`)
  }

  private async mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
    const mergedPdf = await PDFDocument.create()

    for (const buffer of buffers) {
      const sourcePdf = await PDFDocument.load(buffer)
      const pages = await mergedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices(),
      )

      for (const page of pages) {
        mergedPdf.addPage(page)
      }
    }

    const mergedBytes = await mergedPdf.save()
    return Buffer.from(mergedBytes)
  }

  private getIssueAdvertMarker(index: number): string {
    return `DMRADVSTART${index}END`
  }

  private buildIssueHtml(
    frontpage: string,
    tableOfContents: string,
    adverts: IssuePdfAdvertInput[],
  ): string {
    const divider = '<div class="advert-divider-line"></div>'
    const advertMarkup = adverts
      .map((advert, index) => {
        const marker = this.getIssueAdvertMarker(index)
        return `<div style="font-size:1px;line-height:1;color:#fff;margin:0;padding:0;">${marker}</div>${advert.html}`
      })
      .join(divider)

    if (!advertMarkup) {
      return [frontpage, tableOfContents].join(divider)
    }

    return [frontpage, tableOfContents, advertMarkup].join(divider)
  }

  private async extractAdvertStartPages(
    pdfBuffer: Buffer,
    advertCount: number,
  ): Promise<number[]> {
    const pdfjs = this.getPdfJsLegacy()

    this.logger.debug(`Extracting advert start pages from PDF buffer`, {
      category: LOGGING_CATEGORY,
      advertCount,
    })

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      disableWorker: true,
    })
    const pdf = await loadingTask.promise
    const markers = Array.from({ length: advertCount }, (_, index) =>
      this.getIssueAdvertMarker(index),
    )
    const startPages = new Array<number>(advertCount).fill(-1)

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const textContent = await page.getTextContent()
        const pageText = (textContent.items as Array<{ str?: string }>)
          .map((item) => item.str ?? '')
          .join('')

        for (let markerIndex = 0; markerIndex < markers.length; markerIndex++) {
          if (startPages[markerIndex] !== -1) {
            continue
          }

          if (pageText.includes(markers[markerIndex])) {
            startPages[markerIndex] = pageNumber
          }
        }

        if (startPages.every((value) => value !== -1)) {
          break
        }
      }
    } finally {
      await Promise.resolve(loadingTask.destroy?.())
    }

    const missingIndex = startPages.findIndex((value) => value === -1)
    if (missingIndex !== -1) {
      throw new Error(
        `Failed to resolve start page for advert index ${missingIndex}`,
      )
    }

    for (let i = 1; i < startPages.length; i++) {
      if (startPages[i] <= startPages[i - 1]) {
        throw new Error('Invalid advert marker order in generated issue PDF')
      }
    }

    return startPages
  }

  private measureSpacedTextWidth(
    font: PDFFont,
    text: string,
    fontSize: number,
    letterSpacing: number,
  ): number {
    const characters = text.toLocaleUpperCase('is-IS').split('')
    if (characters.length === 0) {
      return 0
    }

    const textWidth = characters.reduce(
      (width, character) => width + font.widthOfTextAtSize(character, fontSize),
      0,
    )

    return textWidth + letterSpacing * (characters.length - 1)
  }

  private drawSpacedUppercaseText(
    page: PDFPage,
    font: PDFFont,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    letterSpacing: number,
  ): void {
    let cursorX = x

    for (const character of text.toLocaleUpperCase('is-IS').split('')) {
      page.drawText(character, {
        x: cursorX,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      cursorX += font.widthOfTextAtSize(character, fontSize) + letterSpacing
    }
  }

  private async stampIssueHeaders(
    pdfBuffer: Buffer,
    adverts: IssuePdfAdvertInput[],
    startPages: number[],
  ): Promise<Buffer> {
    this.logger.debug(`Stamping issue headers on PDF`, {
      category: LOGGING_CATEGORY,
      advertCount: adverts.length,
      startPages,
    })

    const pdfDocument = await PDFDocument.load(pdfBuffer)
    const font = await pdfDocument.embedFont(StandardFonts.TimesRoman)
    const pages = pdfDocument.getPages()
    const totalPages = pages.length
    const firstAdvertPage = startPages[0]

    for (let advertIndex = 0; advertIndex < adverts.length; advertIndex++) {
      const advert = adverts[advertIndex]
      const startPage = startPages[advertIndex]
      const endPage =
        advertIndex + 1 < startPages.length
          ? startPages[advertIndex + 1] - 1
          : totalPages

      for (
        let absolutePage = startPage;
        absolutePage <= endPage;
        absolutePage++
      ) {
        const page = pages[absolutePage - 1]
        const { width, height } = page.getSize()
        const headerWidthPx = 600
        const pxToPt = 72 / 96
        const targetHeaderWidth = headerWidthPx * pxToPt
        const minSideInset = 56
        const maxHeaderWidth = width - minSideInset * 2
        const headerWidth = Math.min(targetHeaderWidth, maxHeaderWidth)
        const headerLeftX = (width - headerWidth) / 2
        const headerRightX = headerLeftX + headerWidth
        const showTopBanner =
          advertIndex === 0 &&
          absolutePage === startPage &&
          Boolean(advert.issueTopMeta)
        let rowY = height - 74

        if (showTopBanner) {
          const leftBannerText = 'Stjórnartíðindi'
          const rightBannerText = String(advert.issueTopMeta ?? '')
          const letterSpacing = 2
          const availableWidth = headerWidth
          let bannerFontSize = 44

          while (bannerFontSize > 18) {
            const leftWidth = this.measureSpacedTextWidth(
              font,
              leftBannerText,
              bannerFontSize,
              letterSpacing,
            )
            const rightWidth = this.measureSpacedTextWidth(
              font,
              rightBannerText,
              bannerFontSize,
              letterSpacing,
            )

            if (leftWidth + rightWidth + 32 <= availableWidth) {
              break
            }

            bannerFontSize -= 2
          }

          const rightWidth = this.measureSpacedTextWidth(
            font,
            rightBannerText,
            bannerFontSize,
            letterSpacing,
          )
          const bannerY = height - 56
          const borderTopY = bannerY - 12
          const borderBottomY = borderTopY - 3

          this.drawSpacedUppercaseText(
            page,
            font,
            leftBannerText,
            headerLeftX,
            bannerY,
            bannerFontSize,
            letterSpacing,
          )
          this.drawSpacedUppercaseText(
            page,
            font,
            rightBannerText,
            headerRightX - rightWidth,
            bannerY,
            bannerFontSize,
            letterSpacing,
          )

          page.drawLine({
            start: { x: headerLeftX, y: borderTopY },
            end: { x: headerRightX, y: borderTopY },
            thickness: 0.8,
            color: rgb(0, 0, 0),
          })
          page.drawLine({
            start: { x: headerLeftX, y: borderBottomY },
            end: { x: headerRightX, y: borderBottomY },
            thickness: 0.8,
            color: rgb(0, 0, 0),
          })

          rowY = borderBottomY - 18
        }

        const dateText = formatAnyDate(advert.publicationDate)
        const pageNumberText = `${absolutePage - firstAdvertPage + 1}`
        const serialText = `Nr. ${advert.serial}`
        const rowFontSize = 10
        const leftX = headerLeftX
        const rightX = headerRightX - font.widthOfTextAtSize(serialText, rowFontSize)
        const centerX =
          headerLeftX +
          (headerWidth - font.widthOfTextAtSize(pageNumberText, rowFontSize)) / 2

        page.drawText(dateText, {
          x: leftX,
          y: rowY,
          size: rowFontSize,
          font,
          color: rgb(0, 0, 0),
        })
        page.drawText(pageNumberText, {
          x: centerX,
          y: rowY,
          size: rowFontSize,
          font,
          color: rgb(0, 0, 0),
        })
        page.drawText(serialText, {
          x: rightX,
          y: rowY,
          size: rowFontSize,
          font,
          color: rgb(0, 0, 0),
        })
      }
    }

    return Buffer.from(await pdfDocument.save())
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
          simpleSanitize(addition.content as HTMLText)
            ? `
            <section class="appendix">
              <h2 class="appendix__title">${addition.title}</h2>
              <div class="appendix__text">
                ${simpleSanitize(addition.content as HTMLText)}
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
      content: simpleSanitize(answers.advert.html as HTMLText),
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

  @LogAndHandle({ logArgs: false })
  private async generatePdfFromHtml(
    htmlContent: string,
    header?: string,
  ): Promise<ResultWrapper<Buffer>> {
    const attempt = async () => {
      try {
        const browser = await getBrowser()
        try {
          const page = await browser.newPage()
          page.setDefaultTimeout(60000)
          page.setDefaultNavigationTimeout(60000)
          await page.setUserAgent(CHROME_USER_AGENT)

          await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
          await page.addStyleTag({ content: pdfCss })

          await page.evaluate(async () => {
            const images = Array.from(document.querySelectorAll('img'))
            await Promise.all(
              images.map((img) => {
                if (img.complete) return Promise.resolve()
                return new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve())
                  img.addEventListener('error', () => {
                    resolve() // Resolve anyway to not block PDF generation
                  })
                })
              }),
            )
          })

          if (header) {
            const pdf = await page.pdf({
              headerTemplate: `
              <div style="font-size:14px;
                          width:100%;
                          padding:35px 100px;
                          margin:0 auto;
                          display:flex;
                          justify-content:space-between;
                          align-items:center;">
                ${header}
              </div>
            `,
              footerTemplate: '<div></div>',
              displayHeaderFooter: true,
            })

            return pdf
          } else {
            const pdf = await page.pdf()
            return pdf
          }
        } catch (error) {
          this.logger.error(`Failed to generate PDF`, {
            category: LOGGING_CATEGORY,
            error,
          })

          throw error
        } finally {
          await browser.close()
        }
      } catch (error) {
        this.logger.error(`Failed to launch browser for PDF generation`, {
          category: LOGGING_CATEGORY,
          error,
        })

        throw error
      }
    }

    try {
      const buffer = await retryAsync(
        async () => {
          try {
            return await attempt()
          } catch (err: any) {
            const msg = String(err?.message ?? '')
            // If Chrome/DevTools connection dropped, rebuild browser for the next try
            if (
              /Protocol error|Target closed|Connection closed|Session closed|Navigation failed/i.test(
                msg,
              )
            ) {
              this.logger.warn(
                'PDF attempt failed; resetting browser before retry',
                {
                  category: LOGGING_CATEGORY,
                  error: msg,
                },
              )
            }
            throw err // let retryAsync back off and retry
          }
        },
        PDF_RETRY_ATTEMPTS,
        PDF_RETRY_DELAY,
      )

      return ResultWrapper.ok(buffer)
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
    serial?: number | string,
    correctionDate?: string | Date,
  ): Promise<ResultWrapper<Buffer>> {
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()
    const activeCase = caseDetailedMigrate(caseLookup)
    if (!activeCase.publishedAt && publishedAt) {
      activeCase.publishedAt = publishedAt
    }
    if (!activeCase.publicationNumber && serial) {
      activeCase.publicationNumber = serial.toString()
    }
    let markup = advertPdfTemplate({
      title: activeCase.advertTitle,
      type: activeCase.advertType.title,
      content: simpleSanitize(activeCase.html as HTMLText),
      additions: handlePdfAdditions(activeCase.additions),
      signature: activeCase.signature.html,
      subSignature:
        activeCase.publishedAt && activeCase.advertDepartment.title
          ? `<div class="sub_signature">${activeCase.advertDepartment.title} - Útgáfudagur: ${formatAnyDate(activeCase.publishedAt)}</div>`
          : undefined,
      correction: correctionDate
        ? `<div class="correction"><p>Leiðrétt skjal: ${formatAnyDate(correctionDate)}</p></div>`
        : '',
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
        ? `<span style="font-family:'Times New Roman', serif;">Nr. ${activeCase.publicationNumber}</span>${activeCase.hideSignatureDate ? '' : `<span style="font-family:'Times New Roman', serif;">${formatAnyDate(newest)}</span>`}`
        : ''

    if (activeCase.hideSignatureDate) {
      markup = markup + '<style>.signature__date { display: none; }</style>'
    }
    const pdfResults = await this.generatePdfFromHtml(markup, header)

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

  async generateIssuePdf(
    frontpage: string,
    tableOfContents: string,
    adverts: IssuePdfAdvertInput[],
  ): Promise<Buffer> {
    try {
      const combinedHtml = this.buildIssueHtml(
        frontpage,
        tableOfContents,
        adverts,
      )
      const combinedResult = await this.generatePdfFromHtml(combinedHtml)
      if (!combinedResult.result.ok) {
        throw combinedResult.result.error
      }

      if (adverts.length === 0) {
        return combinedResult.result.value
      }

      const startPages = await this.extractAdvertStartPages(
        combinedResult.result.value,
        adverts.length,
      )

      return await this.stampIssueHeaders(
        combinedResult.result.value,
        adverts,
        startPages,
      )
    } catch (error) {
      this.logger.error(`Failed to generate issue PDF`, {
        category: LOGGING_CATEGORY,
        error,
      })
      throw new Error('Failed to generate issue PDF')
    }
  }
}
