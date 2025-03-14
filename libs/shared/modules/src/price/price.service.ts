import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertFeeType,
  ApplicationFeeCodesResponse,
  CasePriceResponse,
  GetAllFeeCodesParams,
  UpdateCasePriceBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import {
  BASE_FEE_CODES,
  feeCodeCalculations,
  mapDepartmentSlugToCodes,
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
 * Service class for interacting with the S3 bucket. Handles all S3-related operations.
 * For now it only handles uploads for the attachment bucket.
 * Maybe in the future add bucket as a parameter to the methods
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
      return await this.getFeeCalculation(
        application.answers.advert.department.slug,
        application.answers?.advert.html,
        application.answers?.advert.requestedDate,
        [], // At application level we don't have additional fee codes. Base only.
        transaction,
      )
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
  async getFeeByCase(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CasePriceResponse>> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['id', 'transaction'],
      include: [
        {
          model: CaseTransactionModel,
          attributes: ['id', 'price'],
        },
      ],
      transaction,
    })

    if (!caseLookup || !caseLookup.transaction) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
        category: LOGGING_CATEGORY,
      })
    }

    return ResultWrapper.ok({ price: caseLookup.transaction.price ?? 0 })
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
        attributes: ['id', 'html', 'requestedPublicationDate', 'departmentId'],
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

      const TESTERSON = await this.caseTransactionModel.findOne({
        where: { caseId },
        attributes: ['feeCodes'], // Explicitly include the field
      })

      const caseFeeCalculation = await this.getFeeCalculation(
        caseLookup.department.slug,
        caseLookup.html,
        caseLookup.requestedPublicationDate,
        body.feeCodes,
        transaction,
      )

      const price = caseFeeCalculation.unwrap().price

      const [caseTransaction] = await this.caseTransactionModel.upsert(
        {
          caseId,
          externalReference: new Date().toISOString(),
          price,
          feeCodes: body.feeCodes ?? undefined,
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
  async getFeeCalculation(
    departmentSlug: string,
    textBody: string,
    publishDate: string,
    additionalFeeCodes?: string[],
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ price: number }>> {
    const { baseCode, fastTrackCode, characterCode } =
      mapDepartmentSlugToCodes(departmentSlug)

    const addedCodes = additionalFeeCodes || []
    const feeCodesArray = [
      baseCode,
      fastTrackCode,
      characterCode,
      ...addedCodes,
    ]

    const feeCodes = await this.feeCodeModel.findAndCountAll({
      distinct: true,
      attributes: ['id', 'feeCode', 'feeType', 'value'],
      where: {
        feeCode: {
          [Op.in]: feeCodesArray,
        },
      },
      transaction,
    })

    const migrated = feeCodes.rows.map((feeCode) =>
      applicationFeeCodeMigrate(feeCode),
    )

    const base = migrated.find((f) => f.feeCode === baseCode)?.value
    const fastTrack = migrated.find((f) => f.feeCode === fastTrackCode)?.value
    const charModifier = migrated.find(
      (f) => f.feeCode === characterCode,
    )?.value

    if (!base || !fastTrack || !charModifier) {
      return ResultWrapper.err({
        category: LOGGING_CATEGORY,
        code: 500,
        message:
          'Fee code error. Could not find base, fastTrack or charModifier',
      })
    }

    const fixedValues = migrated
      .filter(
        (obj) =>
          addedCodes.includes(obj.feeCode) &&
          obj.feeType === AdvertFeeType.Fixed,
      )
      .map((obj) => obj.value)

    const price = feeCodeCalculations({
      base,
      fastTrack,
      charModifier,
      textBody: textBody,
      publishDate: publishDate,
      fixedValues,
    })

    return ResultWrapper.ok({ price })
  }

  @LogAndHandle()
  @Transactional()
  async getAllFeeCodes(
    params?: GetAllFeeCodesParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationFeeCodesResponse>> {
    const whereClause: any = {
      feeType: {
        [Op.eq]: AdvertFeeType.Fixed,
      },
    }

    if (params?.excludeBaseCodes) {
      whereClause.feeCode = { [Op.notIn]: BASE_FEE_CODES }
    }

    const feeCodes = await this.feeCodeModel.findAndCountAll({
      distinct: true,
      where: whereClause,
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
