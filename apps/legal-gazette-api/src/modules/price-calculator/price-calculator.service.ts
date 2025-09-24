import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertModel, AdvertVersionEnum } from '../advert/advert.model'
import { FeeCodeModel } from '../fee-code/fee-code.model'
import { ITBRService } from '../tbr/tbr.service.interface'
import { TypeModel } from '../type/type.model'
import { IPriceCalculatorService } from './price-calculator.service.interface'

@Injectable()
export class PriceCalculatorService implements IPriceCalculatorService {
  constructor(
    @Inject(ITBRService) private readonly tbrService: ITBRService,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}
  async calculateAdvertPrice(advertId: string): Promise<number> {
    const test = await this.advertModel.findByPkOrThrow(advertId, {
      include: [{ model: TypeModel, include: [{ model: FeeCodeModel }] }],
    })

    const feeCodeResult = test.type.feeCode

    if (!feeCodeResult || feeCodeResult.length === 0) {
      throw new InternalServerErrorException(
        'Fee code not found for advert type',
      )
    }

    // the relation in the db is one-to-one
    // but to handle sequelize join tables we have to treat it as an array
    const feeCodeModel = feeCodeResult[0]

    if (!feeCodeModel.isMultiplied) {
      return feeCodeModel.value
    }

    // the publication lengths should be the same,
    // but since we only charge for the first publication we set it to "A"
    const html = test.htmlMarkup(AdvertVersionEnum.A)

    if (!html) {
      throw new InternalServerErrorException('HTML markup not found for advert')
    }

    return html.length * feeCodeModel.value
  }
}
