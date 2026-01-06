import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/modules'

import { LegalGazetteEvents } from '../../../../core/constants'
import { AdvertVersionEnum } from '../../../../models/advert-publication.model'
import {
  TBRTransactionModel,
  TBRTransactionStatus,
} from '../../../../models/tbr-transactions.model'
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
    private readonly sequelize: Sequelize,
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

    // C-5 Fix: Create PENDING transaction record BEFORE calling TBR API
    // This ensures we have a record of the payment attempt even if TBR succeeds
    // but subsequent operations fail (prevents orphaned TBR claims)
    let transactionRecord: TBRTransactionModel
    try {
      transactionRecord = await this.sequelize.transaction(
        async (transaction) => {
          return this.tbrTransactionModel.create(
            {
              advertId: advert.id,
              feeCodeId: feeCodeId,
              feeCodeMultiplier: expenses.quantity,
              totalPrice: expenses.sum,
              chargeCategory: paymentData.chargeCategory,
              chargeBase: paymentData.chargeBase,
              status: TBRTransactionStatus.PENDING,
            },
            { transaction },
          )
        },
      )

      this.logger.info('Created PENDING transaction record before TBR call', {
        transactionId: transactionRecord.id,
        advertId: advert.id,
        context: LOGGING_CONTEXT,
      })
    } catch (error) {
      this.logger.error('Failed to create PENDING transaction record', {
        advertId: advert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        context: LOGGING_CONTEXT,
      })
      throw error
    }

    // Step 2: Call TBR API (external call - cannot be rolled back)
    try {
      await this.tbrService.postPayment(paymentData)

      this.logger.info('TBR payment posted successfully', {
        advertId: advert.id,
        transactionId: transactionRecord.id,
        context: LOGGING_CONTEXT,
      })

      // Update transaction record to CONFIRMED after successful TBR call
      await this.sequelize.transaction(async (transaction) => {
        await transactionRecord.update(
          { status: TBRTransactionStatus.CREATED },
          { transaction },
        )
      })

      this.logger.info('Transaction record updated to CONFIRMED', {
        transactionId: transactionRecord.id,
        context: LOGGING_CONTEXT,
      })
    } catch (error) {
      // TBR call failed - update transaction record to FAILED
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      this.logger.error(
        'TBR payment failed, marking transaction as FAILED',
        {
          advertId: advert.id,
          transactionId: transactionRecord.id,
          error: errorMessage,
          context: LOGGING_CONTEXT,
        },
      )

      try {
        await this.sequelize.transaction(async (transaction) => {
          await transactionRecord.update(
            {
              status: TBRTransactionStatus.FAILED,
              tbrError: errorMessage,
            },
            { transaction },
          )
        })
      } catch (updateError) {
        this.logger.error(
          'Failed to update transaction record to FAILED status',
          {
            transactionId: transactionRecord.id,
            originalError: errorMessage,
            updateError:
              updateError instanceof Error
                ? updateError.message
                : 'Unknown error',
            context: LOGGING_CONTEXT,
          },
        )
      }

      throw error
    }
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
