import { Body, Controller, Post } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { Auth } from '@island.is/auth-nest-tools'

import { AdvertName } from '../../lib/constants'
import { AdvertCreateAttributes, AdvertModel } from '../advert/advert.model'
import { TypeIdEnum } from '../type/type.model'
import { CreateBankruptcyAdvertDto } from './dto/bankruptcy-advert.dto'
import { BankruptcyAdvertModel } from './models/bankruptcy-advert.model'

@Controller({
  path: 'adverts/bankruptcy',
  version: '1',
})
export class BankruptcyAdvertController {
  constructor(
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  @Post('')
  @LGResponse({ operationId: 'createBankruptcyAdvert', status: 201 })
  async createBankruptcyAdvert(
    @CurrentUser() user: Auth,
    @Body() body: CreateBankruptcyAdvertDto,
  ) {
    const args: AdvertCreateAttributes = {
      title: AdvertName.BANKRUPTCY_ADVERT,
      submittedBy: 'Testing 123', // TODO: Use user information
      typeId: TypeIdEnum.BANKRUPTCY_ADVERT,
      categoryId: '67cd8559-ea7a-45ae-8de1-e87005c35531', // TODO: make this default if this type?
      scheduledAt: new Date(body.scheduledAt),
      caseId: body.caseId,
      bankruptcyAdvert: {
        judgmentDate: new Date(body.bankruptcyAdvert.judgmentDate),
        claimsSentTo: body.bankruptcyAdvert.claimsSentTo,
        signatureLocation: body.bankruptcyAdvert.signatureLocation,
        signatureDate: new Date(body.bankruptcyAdvert.signatureDate),
        signatureName: body.bankruptcyAdvert.signatureName,
        additionalText: body.bankruptcyAdvert.additionalText,
        courtDistrictId: body.bankruptcyAdvert.courtDistrictId,
        signatureOnBehalfOf: body.bankruptcyAdvert.signatureOnBehalfOf,
      },
    }

    const advert = await this.advertModel.create(args, {
      returning: true,
      include: [BankruptcyAdvertModel],
    })

    return advert.fromModel()
  }
}
