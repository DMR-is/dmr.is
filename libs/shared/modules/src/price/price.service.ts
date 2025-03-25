import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertFeeType,
  CaseFeeCalculationBody,
  CasePriceResponse,
  CaseTransaction,
  GetPaymentQuery,
  GetPaymentResponse,
  PaymentExpenses,
  TransactionFeeCodesResponse,
  UpdateCasePaymentBody,
  UpdateCasePriceBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import {
  getFastTrack,
  getHtmlTextLength,
  MAX_CHARACTER_HTML,
} from '@dmr.is/utils'

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { IAuthService } from '../auth/auth.service.interface'
import { TransactionFeeCodeMigrate } from '../case/migrations/transaction-fee-codes.migrate'
import {
  CaseModel,
  CaseTransactionModel,
  TransactionFeeCodesModel,
} from '../case/models'
import {
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../journal/models'
import { IPriceService } from './price.service.interface'

const LOGGING_CATEGORY = 'price-service'
type PriceByDepartmentResponse = Partial<Omit<CaseTransaction, 'id'>> & {
  expenses: PaymentExpenses[]
}

/**
 * Service class for getting and calculating prices for applications and cases.
 * @implements IPriceService
 */
@Injectable()
export class PriceService implements IPriceService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(forwardRef(() => IApplicationService))
    private applicationService: IApplicationService,

    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,

    @InjectModel(AdvertDepartmentModel)
    private readonly advertDepartmentModel: typeof AdvertDepartmentModel,

    @InjectModel(CaseTransactionModel)
    private readonly caseTransactionModel: typeof CaseTransactionModel,

    @Inject(IAuthService)
    private readonly authService: IAuthService,

    @InjectModel(TransactionFeeCodesModel)
    private readonly feeCodeModel: typeof TransactionFeeCodesModel,

    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  async getFeeByApplication(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CasePriceResponse>> {
    const { application } = (
      await this.applicationService.getApplication(applicationId)
    ).unwrap()

    if (!application) {
      return ResultWrapper.err({
        code: 404,
        message: `Application <${applicationId}> not found`,
        category: LOGGING_CATEGORY,
      })
    }
    // try {
    const isFastTrack = application.answers?.advert.requestedDate
      ? getFastTrack(new Date(application.answers?.advert.requestedDate))
          .fastTrack
      : false

    const transactionPrice = await this.getPriceByDepartmentSlug(
      {
        slug: application.answers.advert.department.slug,
        bodyLengthCount: getHtmlTextLength(application.answers?.advert.html),
        isFastTrack,
      },
      transaction,
    )
    const price = transactionPrice.unwrap().price

    if (!price) {
      return ResultWrapper.err({
        code: 404,
        message: `No price found for <${applicationId}>`,
        category: LOGGING_CATEGORY,
      })
    }
    return ResultWrapper.ok({ price })
  }

  @LogAndHandle()
  @Transactional()
  async postExternalPaymentByCaseId(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: [
        'id',
        'transactionId',
        'transaction',
        'caseNumber',
        'involvedPartyId',
        'involvedParty',
        'html',
        'fastTrack',
      ],
      include: [
        {
          model: CaseTransactionModel,
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'nationalId'],
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

    if (!caseLookup.transaction) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case transaction not found',
        category: LOGGING_CATEGORY,
      })
    }

    const caseFeeCalculation = await this.getPriceByDepartmentSlug(
      {
        slug: caseLookup.department.slug,
        isFastTrack: caseLookup.fastTrack,
        imageTier: caseLookup?.transaction.imageTier ?? undefined,
        baseDocumentCount: caseLookup?.transaction.customBaseCount ?? 0,
        bodyLengthCount:
          caseLookup?.transaction.customAdditionalCharacterCount ??
          getHtmlTextLength(caseLookup.html),
        additionalDocCount:
          caseLookup?.transaction.customAdditionalDocCount ?? 0,
      },
      transaction,
    )

    const feeCalculation = caseFeeCalculation.unwrap()

    this.postExternalPayment(
      caseId,
      {
        id: caseLookup?.transaction.id,
        chargeBase: caseLookup.caseNumber,
        Expenses: feeCalculation.expenses,
        debtorNationalId: caseLookup.involvedParty.nationalId,
      },
      transaction,
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePriceByCaseId(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    // try {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: [
        'id',
        'html',
        'requestedPublicationDate',
        'departmentId',
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

    const caseFeeCalculation = await this.getPriceByDepartmentSlug(
      {
        slug: caseLookup.department.slug,
        bodyLengthCount: characterLength,
        isFastTrack: caseLookup.fastTrack,
        imageTier: body.imageTier,
        baseDocumentCount: body.customBaseDocumentCount,
        additionalDocCount: body.customAdditionalDocCount,
      },
      transaction,
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
        feeCodes: feeCalculation.feeCodes,
        imageTier: body.imageTier ?? null,
      },
      { transaction, conflictFields: ['case_id'] },
    )

    await this.caseModel.update(
      { transactionId: caseTransaction.id },
      { where: { id: caseId }, transaction },
    )
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  private async getPriceByDepartmentSlug(
    body: CaseFeeCalculationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PriceByDepartmentResponse>> {
    const feeCodes = await this.feeCodeModel.findAndCountAll({
      distinct: true,
      attributes: ['id', 'feeCode', 'feeType', 'value', 'description'],
      where: {
        department: {
          [Op.eq]: body.slug,
        },
      },
      transaction,
    })

    const fees = feeCodes.rows.map((feeCode) =>
      TransactionFeeCodeMigrate(feeCode),
    )
    const baseFee = fees.find((fee) => fee.feeType === AdvertFeeType.Base)
    const additionalDocFee = fees.find(
      (fee) => fee.feeType === AdvertFeeType.AdditionalDoc,
    )
    const baseModifierFee = fees.find(
      (fee) => fee.feeType === AdvertFeeType.BaseModifier,
    )

    // const customMultiplierFee = fees.find(
    //   (fee) => fee.feeType === AdvertFeeType.CustomMultiplier,
    // )

    const imageTierFee = fees.find((fee) => fee.feeCode === body.imageTier)
    const fastTrackModifier = fees.find(
      (fee) => fee.feeType === AdvertFeeType.FastTrack,
    )

    if (!baseFee) {
      return ResultWrapper.err({
        category: LOGGING_CATEGORY,
        code: 500,
        message: 'Base fee not found',
      })
    }

    let characterFee = 0
    let additionalDocPrice = 0
    let imageTierPrice = 0
    let fastTrackMultiplier = 1
    // const customMultiplierValue = 0
    let baseTransactionFee = baseFee.value
    let charactersOverBaseMax = 0
    let baseCount = 0
    const usedFeeCodes = []
    const expenses: PaymentExpenses[] = []

    const characterLength = body.bodyLengthCount

    if (
      baseModifierFee?.value &&
      characterLength &&
      characterLength > MAX_CHARACTER_HTML
    ) {
      // B-department
      charactersOverBaseMax = characterLength - MAX_CHARACTER_HTML
      characterFee = baseModifierFee.value * charactersOverBaseMax
      baseTransactionFee = baseFee.value + characterFee
      usedFeeCodes.push(baseModifierFee.feeCode)
      usedFeeCodes.push(baseFee.feeCode)
      baseCount = charactersOverBaseMax

      expenses.push({
        FeeCode: baseFee.feeCode,
        Reference: baseFee.description,
        Quantity: 1,
        UnitPrice: baseFee.value,
        Sum: baseFee.value,
      })

      expenses.push({
        FeeCode: baseModifierFee.feeCode,
        Reference: baseModifierFee.description,
        Quantity: charactersOverBaseMax,
        UnitPrice: baseModifierFee?.value,
        Sum: characterFee,
      })
    } else if (body.baseDocumentCount && body.baseDocumentCount > 1) {
      // A and C department
      baseTransactionFee = baseFee.value * body.baseDocumentCount
      baseCount = body.baseDocumentCount

      usedFeeCodes.push(baseFee.feeCode)
      expenses.push({
        FeeCode: baseFee.feeCode,
        Reference: baseFee.description,
        Quantity: body.baseDocumentCount,
        UnitPrice: baseFee.value,
        Sum: baseTransactionFee,
      })
    } else {
      // No extra document & no extra charachers over base max. (Could be A, B or C department).
      usedFeeCodes.push(baseFee.feeCode)
      expenses.push({
        FeeCode: baseFee.feeCode,
        Reference: baseFee.description,
        Quantity: 1,
        UnitPrice: baseFee.value,
        Sum: baseFee.value,
      })
    }

    if (body.additionalDocCount && additionalDocFee?.value) {
      additionalDocPrice = body.additionalDocCount * additionalDocFee.value
      usedFeeCodes.push(additionalDocFee.feeCode)
      expenses.push({
        FeeCode: additionalDocFee.feeCode,
        Reference: additionalDocFee.description,
        Quantity: body.additionalDocCount,
        UnitPrice: additionalDocFee.value,
        Sum: additionalDocPrice,
      })
    }

    if (imageTierFee?.value) {
      imageTierPrice = imageTierFee.value
      usedFeeCodes.push(imageTierFee.feeCode)
      expenses.push({
        FeeCode: imageTierFee.feeCode,
        Reference: imageTierFee.description,
        Quantity: 1,
        UnitPrice: imageTierFee.value,
        Sum: imageTierFee.value,
      })
    }

    // if (customMultiplierFee?.value) {
    //   // customMultiplierValue = (baseTransactionFee * body.customMultiplierValue) - baseTransactionFee
    //   usedFeeCodes.push(customMultiplierFee.feeCode)
    //   expenses.push({
    //     FeeCode: customMultiplierFee.feeCode,
    //     Reference: customMultiplierFee.description,
    //     Quantity: 1,
    //     UnitPrice: customMultiplierValue,
    //     Sum: customMultiplierValue,
    //   })
    // }

    if (fastTrackModifier?.value && body.isFastTrack) {
      usedFeeCodes.push(fastTrackModifier.feeCode)
      fastTrackMultiplier = fastTrackModifier.value

      const fastTrackPrice =
        baseTransactionFee * fastTrackMultiplier - baseTransactionFee
      expenses.push({
        FeeCode: fastTrackModifier.feeCode,
        Reference: fastTrackModifier.feeCode,
        Quantity: 1,
        UnitPrice: fastTrackPrice,
        Sum: fastTrackPrice,
      })
    }

    const price =
      baseTransactionFee * fastTrackMultiplier +
      additionalDocPrice +
      imageTierPrice

    // Return fee codes as well!
    return ResultWrapper.ok({
      price,
      customBaseCount: baseCount ?? null,
      customDocCount: body.additionalDocCount ?? null,
      feeCodes: usedFeeCodes,
      imageTier: body.imageTier ?? null,
      expenses,
    })
  }

  // Payment section:

  @LogAndHandle()
  @Transactional()
  async postExternalPayment(
    caseId: string,
    body: UpdateCasePaymentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    if (!process.env.FEE_SERVICE_CRED) {
      return ResultWrapper.err({
        category: LOGGING_CATEGORY,
        code: 500,
        message: 'Fee service credentials not found',
      })
    }

    const credentials = btoa(process.env.FEE_SERVICE_CRED)
    const res = await this.authService.xroadFetch(
      `${process.env.XROAD_FJS_PATH}/claim`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          UUID: body.id,
          office: process.env.FEE_SERVICE_OFFICE_ID,
          chargeCategory: process.env.FEE_SERVICE_CHARGE_CATEGORY,
          chargeBase: body.chargeBase,
          Expenses: body.Expenses,
          debtorNationalId: body.debtorNationalId,
          employeeNationalId: body.debtorNationalId,
          extraData: body.extra,
        }),
      },
    )
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async getExternalPaymentStatus(
    parameters: GetPaymentQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetPaymentResponse>> {
    if (!process.env.FEE_SERVICE_CRED) {
      return ResultWrapper.err({
        category: LOGGING_CATEGORY,
        code: 500,
        message: 'Fee service credentials not found',
      })
    }

    const caseLookup = await this.caseModel.findByPk(parameters.caseId, {
      attributes: ['id', 'caseNumber', 'involvedPartyId', 'involvedParty'],
      include: [
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'nationalId'],
        },
      ],
      transaction,
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found for payment status',
        category: LOGGING_CATEGORY,
      })
    }

    const debtorNationalId = caseLookup.involvedParty.nationalId

    const credentials = btoa(process.env.FEE_SERVICE_CRED)
    const res = await this.authService.xroadFetch(
      `${process.env.XROAD_FJS_PATH}/claim/${debtorNationalId}?office=${process.env.FEE_SERVICE_OFFICE_ID}&chargeCategory=${process.env.FEE_SERVICE_CHARGE_CATEGORY}&chargeBase=${caseLookup.caseNumber}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      },
    )

    if (res.status === 404) {
      this.logger.debug(
        'price.service.getExternalPaymentStatus, payment not found',
      )
      return ResultWrapper.ok({
        paid: false,
        created: false,
        capital: 0,
        canceled: false,
      })
    }

    if (!res.ok) {
      this.logger.error(
        `price.service.getExternalPaymentStatus, could not get payment<${parameters.caseId}>`,
        {
          status: res.status,
          category: LOGGING_CATEGORY,
        },
      )
      return ResultWrapper.err({
        code: res.status,
        message: `Payment status <${parameters.caseId}> error`,
      })
    }

    const jsonResponse = await res.json()
    const paymentStatus = jsonResponse.result

    return ResultWrapper.ok({
      created: true,
      capital: paymentStatus.capital,
      canceled: paymentStatus.canceled,
      paid: paymentStatus.capital === 0 && paymentStatus.canceled === false,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getAllFeeCodes(
    transaction?: Transaction,
  ): Promise<ResultWrapper<TransactionFeeCodesResponse>> {
    const feeCodes = await this.feeCodeModel.findAndCountAll({
      distinct: true,
      transaction,
    })

    if (!feeCodes) {
      return ResultWrapper.err({
        category: LOGGING_CATEGORY,
        code: 404,
        message: 'FIXED fee codes not found',
      })
    }

    const migratedFeeCodes = feeCodes.rows.map((feeCode) =>
      TransactionFeeCodeMigrate(feeCode),
    )

    return ResultWrapper.ok({ codes: migratedFeeCodes })
  }
}
