import { Transaction } from 'sequelize'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  CaseModel,
  CaseTransactionModel,
} from '@dmr.is/official-journal/models'
import { IPriceService } from '@dmr.is/official-journal/modules/price'
import { ResultWrapper } from '@dmr.is/types'
import { getHtmlTextLength } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { UpdateCasePriceBody } from '../case/dto/update-price-body.dto'
import { ICasePaymentService } from './payment.service.interface'

const LOGGING_CATEGORY = 'case-payment-service'
const LOGGING_CONTEXT = 'CasePaymentService'

@Injectable()
export class CasePaymentService implements ICasePaymentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IPriceService) private readonly priceService: IPriceService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseTransactionModel)
    private readonly caseTransactionModel: typeof CaseTransactionModel,
  ) {}

  @LogAndHandle()
  @Transactional()
  async postExternalPaymentByCaseId(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['id', 'caseNumber', 'html', 'fastTrack'],
      include: [
        {
          model: CaseTransactionModel,
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'nationalId'],
        },
        {
          model: AdvertDepartmentModel,
          attributes: ['id', 'slug'],
        },
      ],
      transaction,
    })

    if (!caseLookup) {
      this.logger.warn(
        `Case with id ${caseId} not found`,
        LOGGING_CATEGORY,
        LOGGING_CONTEXT,
      )
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    if (!caseLookup.transaction) {
      this.logger.warn(
        `Case with id ${caseId} does not have a transaction`,
        LOGGING_CATEGORY,
        LOGGING_CONTEXT,
      )
      return ResultWrapper.err({
        code: 404,
        message: 'Case transaction not found',
      })
    }

    const feeCalculation = ResultWrapper.unwrap(
      await this.priceService.getPriceByDepartmentSlug({
        slug: caseLookup.department.slug,
        isFastTrack: caseLookup.fastTrack,
        imageTier: caseLookup.transaction.imageTier ?? undefined,
        baseDocumentCount: caseLookup.transaction.customBaseCount ?? 0,
        bodyLengthCount:
          caseLookup.transaction.customAdditionalCharacterCount ??
          getHtmlTextLength(caseLookup.html),
        additionalDocCount:
          caseLookup.transaction.customAdditionalDocCount ?? 0,
      }),
    )

    await this.priceService.postExternalPayment({
      id: caseLookup.transaction.id,
      chargeBase: caseLookup.caseNumber,
      Expenses: feeCalculation.expenses,
      debtorNationalId: caseLookup.involvedParty.nationalId,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePriceByCaseId(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: [
        'id',
        'html',
        'requestedPublicationDate',
        'fastTrack',
        'caseNumber',
      ],
      include: [
        {
          model: AdvertDepartmentModel,
          attributes: ['id', 'slug'],
        },
      ],
      transaction,
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
        category: LOGGING_CATEGORY,
      })
    }

    const characterLength =
      body.customBodyLengthCount || getHtmlTextLength(caseLookup.html)

    const caseFeeCalculation = await this.priceService.getPriceByDepartmentSlug(
      {
        slug: caseLookup.department.slug,
        bodyLengthCount: characterLength,
        isFastTrack: caseLookup.fastTrack,
        imageTier: body.imageTier,
        baseDocumentCount: body.customBaseDocumentCount,
        additionalDocCount: body.customAdditionalDocCount,
        // extraWorkCount: body.extraWorkCount,
      },
    )

    const feeCalculation = caseFeeCalculation.unwrap()

    const [caseTransaction] = await this.caseTransactionModel.upsert(
      {
        caseId,
        externalReference: caseLookup.caseNumber,
        price: feeCalculation.price,
        customBaseCount: body.customBaseDocumentCount ?? null,
        customAdditionalDocCount: body.customAdditionalDocCount ?? null,
        customAdditionalCharacterCount: characterLength ?? null,
        extraWorkCount: body.extraWorkCount ?? null,
        feeCodes: feeCalculation.feeCodes,
        imageTier: body.imageTier ?? null,
        subject: body.subject ?? null,
      },
      { transaction, conflictFields: ['case_id'] },
    )

    await this.caseModel.update(
      { transactionId: caseTransaction.id },
      { where: { id: caseId }, transaction },
    )
    return ResultWrapper.ok()
  }
}
