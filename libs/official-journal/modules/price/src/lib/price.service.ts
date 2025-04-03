import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ResultWrapper } from '@dmr.is/types'
import { MAX_CHARACTER_HTML } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IPriceService } from './price.service.interface'

import { IAuthService } from '@dmr.is/official-journal/modules/auth'
import {
  TransactionFeeCodesModel,
  AdvertFeeTypeEnum,
} from '@dmr.is/official-journal/models'
import { transactionFeeCodeMigrate } from './migrations/transaction-fee-code.migrate'
import { TransactionFeeCodesResponse } from './dto/transaction-free-code.dto'
import {
  GetPaymentQuery,
  GetPaymentResponse,
} from './dto/get-case-payment-response.dto'
import { PaymentExpenses, PostExternalPaymentBody } from './dto/payment.dto'
import { CaseFeeCalculationBody } from './dto/fee-calculator-body.dto'
import { PriceByDepartmentResponse } from './dto/tbr-transaction.dto'

const LOGGING_CATEGORY = 'price-service'
/**
 * Service class for getting and calculating prices
 * @implements IPriceService
 */
@Injectable()
export class PriceService implements IPriceService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IAuthService)
    private readonly authService: IAuthService,

    @InjectModel(TransactionFeeCodesModel)
    private readonly feeCodeModel: typeof TransactionFeeCodesModel,

    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  async getPriceByDepartmentSlug(
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
      transactionFeeCodeMigrate(feeCode),
    )
    const baseFee = fees.find((fee) => fee.feeType === AdvertFeeTypeEnum.Base)
    const additionalDocFee = fees.find(
      (fee) => fee.feeType === AdvertFeeTypeEnum.AdditionalDoc,
    )
    const baseModifierFee = fees.find(
      (fee) => fee.feeType === AdvertFeeTypeEnum.BaseModifier,
    )

    const customMultiplierFee = fees.find(
      (fee) => fee.feeType === AdvertFeeTypeEnum.CustomMultiplier,
    )

    const imageTierFee = fees.find((fee) => fee.feeCode === body.imageTier)
    const fastTrackModifier = fees.find(
      (fee) => fee.feeType === AdvertFeeTypeEnum.FastTrack,
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
    let customMultiplier = 1
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

    if (customMultiplierFee?.feeCode && body.extraWorkCount) {
      usedFeeCodes.push(customMultiplierFee.feeCode)
      customMultiplier = body.extraWorkCount / 100 + 1 // Extra work is in percentage
      const customMultiplierValue =
        baseTransactionFee * customMultiplier - baseTransactionFee
      expenses.push({
        FeeCode: customMultiplierFee.feeCode,
        Reference: customMultiplierFee.description,
        Quantity: 1,
        UnitPrice: customMultiplierValue,
        Sum: customMultiplierValue,
      })
    }

    const price =
      baseTransactionFee * fastTrackMultiplier * customMultiplier +
      additionalDocPrice +
      imageTierPrice

    return ResultWrapper.ok({
      price: Math.round(price),
      customBaseCount: baseCount ?? null,
      customDocCount: body.additionalDocCount ?? null,
      feeCodes: usedFeeCodes,
      imageTier: body.imageTier ?? null,
      expenses,
    })
  }

  @LogAndHandle()
  @Transactional()
  async postExternalPayment(
    body: PostExternalPaymentBody,
  ): Promise<ResultWrapper> {
    if (!process.env.FEE_SERVICE_CRED) {
      return ResultWrapper.err({
        category: LOGGING_CATEGORY,
        code: 500,
        message: 'Fee service credentials not found',
      })
    }

    const credentials = btoa(process.env.FEE_SERVICE_CRED)
    await this.authService.xroadFetch(`${process.env.XROAD_FJS_PATH}/claim`, {
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
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getExternalPaymentStatus(
    params: GetPaymentQuery,
  ): Promise<ResultWrapper<GetPaymentResponse>> {
    if (!process.env.FEE_SERVICE_CRED) {
      return ResultWrapper.err({
        category: LOGGING_CATEGORY,
        code: 500,
        message: 'Fee service credentials not found',
      })
    }

    const credentials = btoa(process.env.FEE_SERVICE_CRED)
    const res = await this.authService.xroadFetch(
      `${process.env.XROAD_FJS_PATH}/claim/${params.debtorNationalId}?office=${process.env.FEE_SERVICE_OFFICE_ID}&chargeCategory=${process.env.FEE_SERVICE_CHARGE_CATEGORY}&chargeBase=${params.chargeBase}`,
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
      this.logger.error(`Could not get payment`, {
        status: res.status,
        chargeBase: params.chargeBase,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: res.status,
        message: `Payment status for charge base ${params.chargeBase} error`,
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
      transactionFeeCodeMigrate(feeCode),
    )

    return ResultWrapper.ok({ codes: migratedFeeCodes })
  }
}
