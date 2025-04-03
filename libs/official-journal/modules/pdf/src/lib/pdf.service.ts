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
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common'

import { cleanupSingleEditorOutput } from '@island.is/regulations-tools/cleanupEditorOutput'
import { HTMLText } from '@island.is/regulations-tools/types'

import { pdfCss } from './lib/pdf.css'
import { IPdfService } from './pdf.service.interface'
import { advertPdfTemplate } from './lib/pdf-advert-template'
import { getBrowser } from './lib/puppetBrowser'
import { applicationSignatureTemplate } from './pdf.utils'
import { IApplicationService } from '@dmr.is/shared/modules/application'
import { InjectModel } from '@nestjs/sequelize'
import {
  AdvertTypeModel,
  CaseAdditionModel,
  CaseModel,
  SignatureModel,
} from '@dmr.is/official-journal/models'
import { OJOIApplication } from '@dmr.is/shared/dto'

const LOGGING_CATEGORY = 'pdf-service'

type PdfBrowser = Browser | CoreBrowser

@Injectable()
export class PdfService implements OnModuleDestroy, IPdfService {
  private browser: PdfBrowser | null = null
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
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
    const { application }: { application: OJOIApplication } =
      ResultWrapper.unwrap(
        await this.applicationService.getApplication(applicationId),
      )

    const { answers } = application
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
        .map(
          (addition) => `
            <section class="appendix">
              <h2 class="appendix__title">${addition.title}</h2>
              <div class="appendix__text">
                ${cleanupSingleEditorOutput(addition.content as HTMLText)}
              </div>
            </section>
          `,
        )
        .join('')
    }

    let markup = advertPdfTemplate({
      title: answers.advert.title,
      type: answers.advert.type.title,
      content: cleanupSingleEditorOutput(answers.advert.html as HTMLText),
      additions: additionHtml,
      signature: signatureHtml,
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
  async generatePdfByCaseId(caseId: string): Promise<ResultWrapper<Buffer>> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['advertTitle', 'html'],
      include: [CaseAdditionModel, SignatureModel, AdvertTypeModel],
    })

    if (!caseLookup) {
      throw new NotFoundException('Case not found')
    }

    const markup = advertPdfTemplate({
      title: caseLookup.advertTitle,
      type: caseLookup.advertType.title,
      content: cleanupSingleEditorOutput(caseLookup.html as HTMLText),
      additions: caseLookup?.additions
        ?.map(
          (addition) => `
        <section class="appendix">
          <h2 class="appendix__title">${addition.title}</h2>
          <div class="appendix__text">
            ${cleanupSingleEditorOutput(addition.content as HTMLText)}
          </div>
        </section>
      `,
        )
        .join(''),
      signature: caseLookup.signature.html,
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
