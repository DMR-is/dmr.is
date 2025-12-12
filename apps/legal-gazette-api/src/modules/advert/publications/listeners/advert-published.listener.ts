import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/modules'

import { LegalGazetteEvents } from '../../../../core/constants'
import { AdvertVersionEnum } from '../../../../models/advert-publication.model'
import { TBRTransactionModel } from '../../../../models/tbr-transactions.model'
import { ITBRService } from '../../../tbr/tbr.service.interface'
import { IPriceCalculatorService } from '../../calculator/price-calculator.service.interface'
import { PdfService } from '../../pdf/pdf.service'
import { AdvertPublishedEvent } from '../events/advert-published.event'

const LOGGING_CONTEXT = 'AdvertPublishedListener'

@Injectable()
export class AdvertPublishedListener {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly sesService: IAWSService,
    @Inject(PdfService) private readonly pdfService: PdfService,
    @Inject(IPriceCalculatorService)
    private readonly priceCalculatorService: IPriceCalculatorService,

    @Inject(ITBRService) private readonly tbrService: ITBRService,
    @InjectModel(TBRTransactionModel)
    private readonly tbrTransactionModel: typeof TBRTransactionModel,
  ) {}

  @OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
  async createTBRTransaction({ advert, publication }: AdvertPublishedEvent) {
    if (publication.version !== AdvertVersionEnum.A) return

    this.logger.info('Creating TBR transaction for advert', {
      advertId: advert.id,
      context: LOGGING_CONTEXT,
    })

    const { feeCodeId, paymentData } =
      await this.priceCalculatorService.getPaymentData(advert.id)

    // expenses is treated as an array
    // but we only support one expense per advert for now
    if (paymentData.expenses.length === 0) {
      this.logger.warn(
        'No expenses found for advert, skipping TBR transaction creation',
        { advertId: advert.id, context: LOGGING_CONTEXT },
      )
      return
    }

    const expenses = paymentData.expenses[0]

    await this.tbrService.postPayment(paymentData)

    this.logger.info('TBR payment posted, creating transaction', {
      advertId: advert.id,
      context: LOGGING_CONTEXT,
    })

    await this.tbrTransactionModel.create({
      advertId: advert.id,
      feeCodeId: feeCodeId,
      feeCodeMultiplier: expenses.quantity,
      totalPrice: expenses.sum,
      chargeCategory: paymentData.chargeCategory,
      chargeBase: paymentData.chargeBase,
    })
  }

  @OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
  async sendEmailNotification({ advert, publication }: AdvertPublishedEvent) {
    this.logger.info('Sending email notification for advert', {
      advertId: advert.id,
      publicationId: publication.id,
      version: publication.version,
      context: LOGGING_CONTEXT,
    })

    const emails = advert.communicationChannels?.map((ch) => ch.email)

    if (!emails || emails.length === 0) {
      this.logger.warn(
        'No emails found for advert, skipping email notification',
        {
          advertId: advert.id,
          publicationId: publication.id,
          version: publication.version,
          context: LOGGING_CONTEXT,
        },
      )
      return
    }

    const message = {
      from: `Lögbirtingablaðið <noreply@logbirtingablad.is>`,
      to: emails?.join(','),
      replyTo: 'noreply@logbirtingablad.is',
      subject: `Auglýsing ${advert.publicationNumber} - ${advert.type.title} ${advert.title} hefur verið útgefin`,
      text: `Auglýsing ${advert.publicationNumber} hefur verið útgefin`,
      html: `<h2>Auglýsing hefur verið útgefin:</h2><h3>${advert.publicationNumber} - ${advert.type.title} ${advert.title}</h3><p><a href="https://logbirtingarblad.is/${advert.id}" target="_blank">Skoða auglýsingu</a></p>`,
    }

    await this.sesService.sendMail(message).catch((error) => {
      this.logger.error('Failed to send email after publication', {
        error: error,
        advertId: advert.id,
        publicationId: publication.id,
        version: publication.version,
        context: LOGGING_CONTEXT,
      })
    })
  }

  @OnEvent(LegalGazetteEvents.ADVERT_PUBLISHED)
  async generatePdf({ advert, publication, html }: AdvertPublishedEvent) {
    this.logger.info('Generating PDF for advert', {
      advertId: publication.advertId,
      publicationId: publication.id,
      version: publication.version,
      context: LOGGING_CONTEXT,
    })

    await this.pdfService
      .generatePdfAndSaveToS3(
        html,
        publication.advertId,
        publication.id,
        advert.title,
      )
      .catch((error) => {
        this.logger.error('Failed to generate PDF after publication', {
          error: error,
          advertId: publication.advertId,
          publicationId: publication.id,
          version: publication.version,
          context: LOGGING_CONTEXT,
        })
      })
  }
}
