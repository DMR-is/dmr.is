import { Browser } from 'puppeteer'
import { Browser as CoreBrowser } from 'puppeteer-core'
import {
  PDF_RETRY_ATTEMPTS,
  PDF_RETRY_DELAY,
  SignatureType,
} from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'
import { retryAsync } from '@dmr.is/utils'

import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'

import { caseMigrate } from '../case/migrations/case.migrate'
import { IUtilityService } from '../utility/utility.module'
import { pdfCss } from './pdf.css'
import { IPdfService } from './pdf.service.interface'
import { advertPdfTemplate } from './pdf-advert-template'
import { getBrowser } from './puppetBrowser'

const LOGGING_CATEGORY = 'pdf-service'

type PdfBrowser = Browser | CoreBrowser

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy, IPdfService {
  private browser: PdfBrowser | null = null
  constructor(
    @Inject(IUtilityService)
    private readonly utilityService: IUtilityService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}
  async onModuleInit() {
    this.browser = await getBrowser()
  }
  async onModuleDestroy() {
    await this.browser?.close()
  }

  async getPdfByApplicationId(
    applicationId: string,
  ): Promise<ResultWrapper<Buffer>> {
    const applicationLookup = await this.utilityService.applicationLookup(
      applicationId,
    )

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

    let signatureHtml = ''

    switch (answers.misc.signatureType) {
      case SignatureType.Committee:
        signatureHtml += answers.signatures.committee?.html
        break
      case SignatureType.Regular:
        signatureHtml += answers.signatures.regular?.map(
          (signature) => signature.html,
        )
        break
    }

    let additionHtml = ''

    if (answers.advert.additions) {
      additionHtml = answers.advert.additions
        .map((addition) => addition.content ?? '')
        .join('')
    }

    const markup = advertPdfTemplate({
      title: answers.advert.title,
      type: answers.advert.typeName,
      content: answers.advert.html,
      additions: additionHtml,
      signature: signatureHtml,
    })

    const pdf = (await this.generatePdfFromHtml(markup)).unwrap()

    return ResultWrapper.ok(pdf)
  }

  @LogAndHandle({ logArgs: false })
  private async generatePdfFromHtml(
    htmlContent: string,
  ): Promise<ResultWrapper<Buffer>> {
    try {
      return retryAsync(
        async () => {
          if (this.browser === null) {
            this.logger.warn(`Tried to use browser before it was initialized`, {
              category: LOGGING_CATEGORY,
            })
            throw new Error('Browser not initialized')
          }

          const page = await this.browser.newPage()
          await page.setContent(htmlContent)
          await page.addStyleTag({
            content: pdfCss,
          })

          const pdf = await page.pdf()
          await page.close()
          return ResultWrapper.ok(pdf)
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
  async getPdfByCaseId(caseId: string): Promise<ResultWrapper<Buffer>> {
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()
    const activeCase = caseMigrate(caseLookup)

    const markup = advertPdfTemplate({
      title: activeCase.advertTitle,
      type: activeCase.advertType.title,
      content: activeCase.html,
      additions: activeCase.additions.map((addition) => addition.html).join(''),
      signature: activeCase.signatures
        .map((signature) => signature.html)
        .join(''),
    })

    const pdfResults = await this.generatePdfFromHtml(markup)

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
