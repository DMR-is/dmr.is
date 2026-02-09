import Kennitala from 'kennitala'
import get from 'lodash/get'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { getHtmlTextLength } from '@dmr.is/utils/serverUtils'

import {
  RECALL_BANKRUPTCY_ADVERT_TYPE_ID,
  RECALL_DECEASED_ADVERT_TYPE_ID,
} from '../../../core/constants'
import { AdvertModel } from '../../../models/advert.model'
import { AdvertVersionEnum } from '../../../models/advert-publication.model'
import { FeeCodeModel } from '../../../models/fee-code.model'
import { TBRCompanySettingsModel } from '../../../models/tbr-company-settings.model'
import { TypeModel } from '../../../models/type.model'
import { IApplicationService } from '../../applications/application.service.interface'
import { GetPaymentDataResponseDto } from '../../tbr/tbr.dto'
import { IPriceCalculatorService } from './price-calculator.service.interface'

const LOGGING_CONTEXT = 'PriceCalculatorService'

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

  async getChargeCategory(nationalId: string): Promise<string> {
    const isPerson = Kennitala.isPerson(nationalId)

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
    this.logger.info('TBR company not found or inactive, using person charge category', {
      nationalId,
      context: LOGGING_CONTEXT,
    })
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
    const [application, preview] = await Promise.all([
      this.applicationService.getApplicationById(applicationId),
      this.applicationService.previewApplication(applicationId),
    ])

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
      const htmlLength = getHtmlTextLength(preview.preview)
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
