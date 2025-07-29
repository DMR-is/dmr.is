import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { Auth } from '@island.is/auth-nest-tools'

import { AdvertCreateAttributes, AdvertModel } from '../../advert/advert.model'
import { CategoryDefaultIdEnum } from '../../category/category.model'
import { TypeEnum, TypeIdEnum } from '../../type/type.model'
import { CreateBankruptcyAdvertDto } from './dto/create-bankruptcy-advert.dto'
import { BankruptcyAdvertModel } from './bankruptcy-advert.model'

@Controller({
  path: 'adverts/bankruptcy',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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
      submittedBy: user.nationalId as string,
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
      },
    }

    const newAdvert = await this.advertModel.create(args, {
      returning: true,
      include: [
        {
          model: BankruptcyAdvertModel,
        },
      ],
    })

    return newAdvert.fromModelDetailed()
  }
}
