import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { Auth } from '@island.is/auth-nest-tools'

import {
  AdvertCreateAttributes,
  AdvertModel,
  AdvertModelScopes,
} from '../advert/advert.model'
import { CategoryDefaultIdEnum } from '../category/category.model'
import { TypeEnum, TypeIdEnum } from '../type/type.model'
import { CreateBankruptcyAdvertDto } from './dto/create-bankruptcy-advert.dto'
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
      title: TypeEnum.BANKRUPTCY_ADVERT,
      submittedBy: 'Testing 123', // TODO: Use user information
      typeId: TypeIdEnum.BANKRUPTCY_ADVERT,
      categoryId: CategoryDefaultIdEnum.BANKRUPTCY_ADVERT,
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
        location: {
          ...body.bankruptcyAdvert.location,
          deadline: new Date(body.bankruptcyAdvert.location.deadline),
        },
      },
    }

    const newAdvert = await this.advertModel.create(args, {
      returning: true,
      include: [BankruptcyAdvertModel],
    })

    const advert = await this.advertModel
      .scope(AdvertModelScopes.BANKRUPTCY_ADVERT)
      .findByPk(newAdvert.id)

    if (!advert) {
      throw new InternalServerErrorException()
    }

    return advert.fromModelDetailed()
  }
}
