import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertFeeType,
  ApplicationFeeCodesResponse,
  CaseFeeCalculationBody,
  CasePriceDetailResponse,
  CasePriceResponse,
  GetAllFeeCodesParams,
  UpdateCasePriceBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import {
  getFastTrack,
  getHtmlTextLength,
  MAX_CHARACTERS_BASE_APPLICATION,
} from '@dmr.is/utils'

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { CaseModel, CaseTransactionModel } from '../case/models'
import { applicationFeeCodeMigrate } from '../journal/migrations/advert-fee-codes.migrate'
import { AdvertDepartmentModel, AdvertFeeCodesModel } from '../journal/models'
import { IPriceService } from './price.service.interface'

const LOGGING_CATEGORY = 'price-service'

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

    @InjectModel(AdvertFeeCodesModel)
    private readonly feeCodeModel: typeof AdvertFeeCodesModel,

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
    try {
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
      return ResultWrapper.ok({ price: transactionPrice.unwrap().price })
    } catch (error) {
      return ResultWrapper.err({
        code: 500,
        message: `Fee calculation failed on application<${applicationId}>. ${error}`,
        category: LOGGING_CATEGORY,
      })
    }
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePriceByCaseId(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    try {
      const caseLookup = await this.caseModel.findByPk(caseId, {
        attributes: [
          'id',
          'html',
          'requestedPublicationDate',
          'departmentId',
          'fastTrack',
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

      const price = caseFeeCalculation.unwrap().price

      const baseCount =
        caseLookup.department.slug === 'b-deild'
          ? characterLength
          : body.customBaseDocumentCount

      const [caseTransaction] = await this.caseTransactionModel.upsert(
        {
          caseId,
          externalReference: new Date().toISOString(), // TODO: use correct ref.
          price,
          customBaseCount: baseCount,
          customDocCount: body.customAdditionalDocCount ?? null,
          feeCodes: body.feeCodes ?? null,
          imageTier: body.imageTier ?? null,
          paid: false,
        },
        { transaction, conflictFields: ['case_id'] },
      )

      await this.caseModel.update(
        { transactionId: caseTransaction.id, price }, // Todo: Remove price from case model. Use transaction object instead
        { where: { id: caseId }, transaction },
      )
    } catch (error) {
      this.logger.error('Could not create transaction: ', error)
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async getPriceByDepartmentSlug(
    body: CaseFeeCalculationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CasePriceDetailResponse>> {
    const feeCodes = await this.feeCodeModel.findAndCountAll({
      distinct: true,
      attributes: ['id', 'feeCode', 'feeType', 'value'],
      where: {
        department: {
          [Op.eq]: body.slug,
        },
      },
      transaction,
    })

    const fees = feeCodes.rows.map((feeCode) =>
      applicationFeeCodeMigrate(feeCode),
    )
    const baseFee = fees.find(
      (fee) => fee.feeType === AdvertFeeType.Base,
    )?.value
    const additionalDocFee = fees.find(
      (fee) => fee.feeType === AdvertFeeType.AdditionalDoc,
    )?.value
    const baseModifierFee = fees.find(
      (fee) => fee.feeType === AdvertFeeType.BaseModifier,
    )?.value
    const imageTierFee = fees.find(
      (fee) => fee.feeCode === body.imageTier,
    )?.value
    const fastTrackModifier = fees.find(
      (fee) => fee.feeType === AdvertFeeType.FastTrack,
    )?.value

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
    let baseTransactionFee = baseFee

    const characterLength = body.bodyLengthCount

    if (
      baseModifierFee &&
      characterLength &&
      characterLength > MAX_CHARACTERS_BASE_APPLICATION
    ) {
      characterFee =
        baseModifierFee * (characterLength - MAX_CHARACTERS_BASE_APPLICATION)
      baseTransactionFee = baseFee + characterFee
    } else if (body.baseDocumentCount && body.baseDocumentCount > 1) {
      baseTransactionFee = baseFee * body.baseDocumentCount
    }

    if (body.additionalDocCount && additionalDocFee) {
      additionalDocPrice = body.additionalDocCount * additionalDocFee
    }

    if (imageTierFee) {
      imageTierPrice = imageTierFee
    }

    if (fastTrackModifier && body.isFastTrack) {
      fastTrackMultiplier = fastTrackModifier
    }

    const price =
      baseTransactionFee * fastTrackMultiplier +
      additionalDocPrice +
      imageTierPrice

    // Return fee codes as well?
    return ResultWrapper.ok({
      price,
      baseFee,
      characterFee,
      additionalDocPrice,
      imageTierPrice,
    })
  }

  @LogAndHandle()
  @Transactional()
  async postExternalPayment(transaction?: Transaction): Promise<ResultWrapper> {
    // Handle external payment.

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async getExternalPayment(transaction?: Transaction): Promise<ResultWrapper> {
    // Get external payment.

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async getAllFeeCodes(
    params?: GetAllFeeCodesParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationFeeCodesResponse>> {
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
      applicationFeeCodeMigrate(feeCode),
    )

    return ResultWrapper.ok({ codes: migratedFeeCodes })
  }
}
