import Kennitala from 'kennitala'

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { getHtmlTextLength } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertVersionEnum } from '../../../models/advert-publication.model'
import { FeeCodeModel } from '../../../models/fee-code.model'
import { TypeModel } from '../../../models/type.model'
import { GetPaymentDataResponseDto } from '../../tbr/tbr.dto'
import { IPriceCalculatorService } from './price-calculator.service.interface'

@Injectable()
export class PriceCalculatorService implements IPriceCalculatorService {
  constructor(
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}
  async getPaymentData(advertId: string): Promise<GetPaymentDataResponseDto> {
    const advert = await this.advertModel.findByPkOrThrow(advertId, {
      include: [{ model: TypeModel, include: [{ model: FeeCodeModel }] }],
    })

    if (!advert.publicationNumber) {
      throw new BadRequestException('Advert is not published')
    }

    const feeCodeResult = advert.type.feeCode

    if (!feeCodeResult || feeCodeResult.length === 0) {
      throw new InternalServerErrorException(
        'Fee code not found for advert type',
      )
    }

    const isPerson = Kennitala.isPerson(advert.createdByNationalId)

    // the relation in the db is one-to-one
    // but to handle sequelize join tables we have to treat it as an array
    const feeCodeModel = feeCodeResult[0]

    if (!feeCodeModel.isMultiplied) {
      return {
        feeCodeId: feeCodeModel.id,
        paymentData: {
          advertId: advertId,
          chargeBase: advert.publicationNumber,
          chargeCategory: isPerson
            ? process.env.LG_TBR_CHARGE_CATEGORY_PERSON!
            : process.env.LG_TBR_CHARGE_CATEGORY_COMPANY!,
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
        advertId: advertId,
        chargeBase: advert.publicationNumber,
        chargeCategory: isPerson
          ? process.env.LG_TBR_CHARGE_CATEGORY_PERSON!
          : process.env.LG_TBR_CHARGE_CATEGORY_COMPANY!,
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
