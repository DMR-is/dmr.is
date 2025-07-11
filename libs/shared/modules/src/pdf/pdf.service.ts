import type { Page } from 'puppeteer'
import { Browser } from 'puppeteer'
import { Browser as CoreBrowser } from 'puppeteer-core'

import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'

import {
  PDF_RETRY_ATTEMPTS,
  PDF_RETRY_DELAY,
  SignatureType,
} from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'
import {
  applicationSignatureTemplate,
  formatAnyDate,
  handlePdfAdditions,
  retryAsync,
} from '@dmr.is/utils'

import { cleanupSingleEditorOutput } from '@island.is/regulations-tools/cleanupEditorOutput'
import { HTMLText } from '@island.is/regulations-tools/types'

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

  @LogAndHandle({ logArgs: false })
  private async generatePdfFromHtml(
    htmlContent: string,
    header?: string,
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
                    `<span style="text-indent: 2em; display: block; max-width: 100%;">${text.trim()}</span>`,
                )
                p.innerHTML = wrappedParts.join('<br>')
              })
            })
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
            await page.close()
            return ResultWrapper.ok(pdf)
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
    const markup = advertPdfTemplate({
      title: activeCase.advertTitle,
      type: activeCase.advertType.title,
      content: cleanupSingleEditorOutput(activeCase.html as HTMLText),
      additions: handlePdfAdditions(activeCase.additions),
      signature: activeCase.signature.html,
      subSignature:
        activeCase.publishedAt && activeCase.advertDepartment.title
          ? `<div class="sub_signature">${activeCase.advertDepartment.title} - Útgáfudagur: ${formatAnyDate(activeCase.publishedAt)}</div>`
          : undefined,
      correction: correctionDate
        ? `<div class="correction"><p>Leiðrétt skjal: ${formatAnyDate(correctionDate)}</p></div>`
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
        ? `<span style="font-family:'Times New Roman', serif;">Nr. ${activeCase.publicationNumber}</span><span style="font-family:'Times New Roman', serif;">${formatAnyDate(newest)}</span>`
        : ''

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
}
