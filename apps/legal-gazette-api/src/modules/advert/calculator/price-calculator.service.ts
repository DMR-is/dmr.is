import { isPersonKennitala } from 'kennitala'
import get from 'lodash/get'
import { Op } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { getApplicationPreview } from '@dmr.is/legal-gazette-html'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { getHtmlTextLength } from '@dmr.is/utils-server/serverUtils'

import {
  RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
  RECALL_DECEASED_ADVERT_TYPE_ID,
} from '../../../core/constants'
import { StatusIdEnum } from '../../../core/enums/status.enum'
import { AdvertModel } from '../../../models/advert.model'
import { AdvertVersionEnum } from '../../../models/advert-publication.model'
import { FeeCodeModel } from '../../../models/fee-code.model'
import { TBRCompanySettingsModel } from '../../../models/tbr-company-settings.model'
import { TypeModel } from '../../../models/type.model'
import { IApplicationService } from '../../applications/application.service.interface'
import { GetApplicationAdvertPriceDto } from '../../applications/dto/application-extra.dto'
import { GetPaymentDataResponseDto } from '../../tbr/dto/tbr.dto'
import { IPriceCalculatorService } from './price-calculator.service.interface'

const LOGGING_CONTEXT = 'PriceCalculatorService'

/**
 * Prices are stored in `numeric` columns, which node-postgres hands back as
 * strings to avoid losing precision. The models declare them as `number`, so a
 * flat fee reaches us as `'1500'` and would silently concatenate rather than
 * add. Coerce before summing, and treat anything non-numeric as unusable.
 */
const toPrice = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  const price = Number(value)

  return Number.isFinite(price) ? price : null
}

@Injectable()
export class PriceCalculatorService implements IPriceCalculatorService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(TypeModel) private readonly typeModel: typeof TypeModel,
    @InjectModel(TBRCompanySettingsModel)
    private readonly tbrCompanySettingsModel: typeof TBRCompanySettingsModel,
  ) {}

  async getEstimatedPrice(advertId: string): Promise<number> {
    const advert = await this.advertModel.scope('detailed').findByPk(advertId, {
      include: [{ model: TypeModel, include: [{ model: FeeCodeModel }] }],
    })

    if (!advert) {
      throw new NotFoundException('Advert not found')
    }

    const feeCodeResult = advert.type.feeCode
    if (!feeCodeResult || feeCodeResult.length === 0) {
      throw new InternalServerErrorException(
        'Fee code not found for advert type',
      )
    }

    const feeCode = feeCodeResult[0]

    // Per-item billing: feeQuantity takes precedence (nauðungarsölur per property,
    // aukatilkynningar hlutafélaga per notification)
    const quantity = advert.feeQuantity ?? 0
    if (quantity > 0) {
      return feeCode.value * quantity
    }

    // Flat fee
    if (!feeCode.isMultiplied) {
      return feeCode.value
    }

    // Text-length billing — use version A since the advert may not be published yet
    const html = advert.htmlMarkup(AdvertVersionEnum.A)
    if (!html || html.length === 0) {
      throw new InternalServerErrorException('HTML markup not found for advert')
    }

    return feeCode.value * getHtmlTextLength(html)
  }

  /**
   * Total price of every advert belonging to an application, as shown to the
   * applicant after the application has been submitted.
   *
   * An advert is only charged once it has been published, so per advert we use
   * the actual charged amount when a transaction exists and fall back to the
   * estimate otherwise. Rejected and withdrawn adverts are never charged and are
   * left out of the total.
   */
  async getApplicationAdvertPrice(
    applicationId: string,
  ): Promise<GetApplicationAdvertPriceDto> {
    const adverts = await this.advertModel.scope('detailed').findAll({
      where: {
        applicationId,
        statusId: {
          [Op.notIn]: [StatusIdEnum.REJECTED, StatusIdEnum.WITHDRAWN],
        },
      },
    })

    if (adverts.length === 0) {
      return { isEstimate: true }
    }

    let totalPrice = 0
    let isEstimate = false

    for (const advert of adverts) {
      const chargedPrice = toPrice(advert.transaction?.totalPrice)

      if (chargedPrice !== null) {
        totalPrice += chargedPrice
        continue
      }

      isEstimate = true

      const estimatedPrice = toPrice(advert.estimatedPrice)

      if (estimatedPrice === null) {
        // A partial sum would be presented to the applicant as the price of the
        // whole application, so omit the total instead of understating it.
        this.logger.warn(
          'Could not estimate the price of an advert, omitting the application total',
          {
            applicationId,
            advertId: advert.id,
            context: LOGGING_CONTEXT,
          },
        )

        return { isEstimate: true }
      }

      totalPrice += estimatedPrice
    }

    return { totalPrice, isEstimate }
  }

  async getChargeCategory(nationalId: string): Promise<string> {
    const isPerson = isPersonKennitala(nationalId)

    // If it's a person, use person charge category
    if (isPerson) {
      const personCategory = process.env.LG_TBR_CHARGE_CATEGORY_PERSON
      if (!personCategory) {
        throw new InternalServerErrorException(
          'LG_TBR_CHARGE_CATEGORY_PERSON environment variable not set',
        )
      }
      return personCategory
    }

    // It's a company - check if it exists and is active in TBRCompanySettingsModel
    const company = await this.tbrCompanySettingsModel.findOne({
      where: {
        nationalId,
        active: true,
      },
    })

    // If company is found and active, use company charge category
    if (company) {
      this.logger.info('TBR company found for charge category', {
        nationalId,
        companyName: company.name,
        context: LOGGING_CONTEXT,
      })
      const companyCategory = process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
      if (!companyCategory) {
        throw new InternalServerErrorException(
          'LG_TBR_CHARGE_CATEGORY_COMPANY environment variable not set',
        )
      }
      return companyCategory
    }

    // Company not found or not active, use person charge category
    this.logger.info(
      'TBR company not found or inactive, using person charge category',
      {
        nationalId,
        context: LOGGING_CONTEXT,
      },
    )
    const personCategory = process.env.LG_TBR_CHARGE_CATEGORY_PERSON
    if (!personCategory) {
      throw new InternalServerErrorException(
        'LG_TBR_CHARGE_CATEGORY_PERSON environment variable not set',
      )
    }
    return personCategory
  }

  async getEstimatedPriceForApplication(
    applicationId: string,
  ): Promise<number> {
    const application =
      await this.applicationService.getApplicationById(applicationId)

    const preview = getApplicationPreview(application.type, application.answers)

    if (preview.error !== null) {
      this.logger.error(
        `Error generating application preview for price calculation: ${preview.error}`,
        {
          applicationId,
          context: LOGGING_CONTEXT,
        },
      )
      throw new InternalServerErrorException(
        'Error generating application preview for price calculation',
      )
    }

    let typeId = null
    switch (application.type) {
      case ApplicationTypeEnum.RECALL_DECEASED:
        typeId = RECALL_DECEASED_ADVERT_TYPE_ID
        break
      case ApplicationTypeEnum.RECALL_BANKRUPTCY:
        typeId = RECALL_BANKRUPTCY_ADVERT_TYPE_ID
        break
      default:
        typeId = get(application.answers, 'fields.type.id', null)
    }

    if (!typeId) {
      this.logger.error(
        `Cannot calculate estimated price without the type id`,
        {
          applicationId,
          context: LOGGING_CONTEXT,
        },
      )
      throw new InternalServerErrorException(
        'Type ID not found for application',
      )
    }

    const type = await this.typeModel.findByPkOrThrow(typeId, {
      include: [{ model: FeeCodeModel, required: true }],
    })

    const feeCode = type.feeCode?.[0]
    if (!feeCode) {
      this.logger.error(
        `Cannot calculate estimated price without the fee code`,
        {
          applicationId,
          typeId,
          context: LOGGING_CONTEXT,
        },
      )
      throw new InternalServerErrorException(
        'Fee code not found for advert type',
      )
    }

    if (feeCode.isMultiplied) {
      const htmlLength = getHtmlTextLength(preview.html)
      return feeCode.value * htmlLength
    }

    return feeCode.value
  }

  async getPaymentData(advertId: string): Promise<GetPaymentDataResponseDto> {
    const advert = await this.advertModel.scope('detailed').findByPk(advertId, {
      include: [{ model: TypeModel, include: [{ model: FeeCodeModel }] }],
    })

    if (!advert) {
      throw new NotFoundException('Advert not found')
    }

    if (!advert.publicationNumber) {
      throw new BadRequestException('Advert is not published')
    }

    const feeCodeResult = advert.type.feeCode

    if (!feeCodeResult || feeCodeResult.length === 0) {
      throw new InternalServerErrorException(
        'Fee code not found for advert type',
      )
    }

    // Get the charge category based on national ID and TBR company settings
    const chargeCategory = await this.getChargeCategory(
      advert.createdByNationalId,
    )

    // the relation in the db is one-to-one
    // but to handle sequelize join tables we have to treat it as an array
    const feeCodeModel = feeCodeResult[0]

    // Per-item billing: feeQuantity is set explicitly on the advert (e.g. nauðungarsölur
    // charges per property, aukatilkynningar hlutafélaga charges per notification).
    // This takes precedence over the type-level isMultiplied text-length calculation.
    const quantity = advert.feeQuantity ?? 0
    if (quantity > 0) {
      return {
        feeCodeId: feeCodeModel.id,
        paymentData: {
          id: advertId,
          chargeBase: advert.publicationNumber,
          chargeCategory,
          debtorNationalId: advert.createdByNationalId,
          expenses: [
            {
              feeCode: feeCodeModel.feeCode,
              quantity: quantity,
              reference: advert.publicationNumber,
              sum: feeCodeModel.value * quantity,
              unitPrice: feeCodeModel.value,
            },
          ],
        },
      }
    }

    if (!feeCodeModel.isMultiplied) {
      return {
        feeCodeId: feeCodeModel.id,
        paymentData: {
          id: advertId,
          chargeBase: advert.publicationNumber,
          chargeCategory,
          debtorNationalId: advert.createdByNationalId,
          expenses: [
            {
              feeCode: feeCodeModel.feeCode,
              quantity: 1,
              reference: feeCodeModel.description,
              sum: feeCodeModel.value,
              unitPrice: feeCodeModel.value,
            },
          ],
        },
      }
    }

    // the publication lengths should be the same,
    // but since we only charge for the first publication we set it to "A"
    const html = advert.htmlMarkup(AdvertVersionEnum.A)

    if (!html || html.length === 0) {
      throw new InternalServerErrorException('HTML markup not found for advert')
    }

    const stripped = getHtmlTextLength(html)

    return {
      feeCodeId: feeCodeModel.id,
      paymentData: {
        id: advertId,
        chargeBase: advert.publicationNumber,
        chargeCategory,
        debtorNationalId: advert.createdByNationalId,
        expenses: [
          {
            feeCode: feeCodeModel.feeCode,
            quantity: stripped,
            reference: advert.publicationNumber,
            sum: feeCodeModel.value * stripped,
            unitPrice: feeCodeModel.value,
          },
        ],
      },
    }
  }
}
