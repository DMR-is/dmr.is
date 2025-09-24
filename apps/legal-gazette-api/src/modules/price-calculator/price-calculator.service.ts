import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertModel, AdvertVersionEnum } from '../advert/advert.model'
import { FeeCodeModel } from '../fee-code/fee-code.model'
import { TBRPostPaymentBodyDto } from '../tbr/dto/tbr.dto'
import { TypeModel } from '../type/type.model'
import { IPriceCalculatorService } from './price-calculator.service.interface'

@Injectable()
export class PriceCalculatorService implements IPriceCalculatorService {
  constructor(
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}
  async getPaymentData(advertId: string): Promise<TBRPostPaymentBodyDto> {
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

    // the relation in the db is one-to-one
    // but to handle sequelize join tables we have to treat it as an array
    const feeCodeModel = feeCodeResult[0]

    if (!feeCodeModel.isMultiplied) {
      return {
        advertId: advertId,
        chargeBase: '',
        debtorNationalId: advert.createdByNationalId,
        expenses: [
          {
            feeCode: feeCodeModel.feeCode,
            quantity: 1,
            reference: advert.publicationNumber,
            sum: feeCodeModel.value,
            unitPrice: feeCodeModel.value,
          },
        ],
      }
    }

    // the publication lengths should be the same,
    // but since we only charge for the first publication we set it to "A"
    const html = advert.htmlMarkup(AdvertVersionEnum.A)

    if (!html) {
      throw new InternalServerErrorException('HTML markup not found for advert')
    }

    return {
      advertId: advertId,
      chargeBase: '',
      debtorNationalId: advert.createdByNationalId,
      expenses: [
        {
          feeCode: feeCodeModel.feeCode,
          quantity: html.length,
          reference: advert.publicationNumber,
          sum: feeCodeModel.value * html.length,
          unitPrice: feeCodeModel.value,
        },
      ],
    }
  }
}
