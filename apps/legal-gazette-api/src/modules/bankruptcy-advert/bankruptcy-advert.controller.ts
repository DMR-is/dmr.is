import {
  Body,
  Controller,
  Inject,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { Auth } from '@island.is/auth-nest-tools'

import { AdvertCreateAttributes, AdvertModel } from '../advert/advert.model'
import { CategoryDefaultIdEnum } from '../category/category.model'
import { TypeEnum, TypeIdEnum } from '../type/type.model'
import { CreateBankruptcyAdvertDto } from './dto/create-bankruptcy-advert.dto'
import { UpdateBankruptcyApplicationDto } from './dto/update-bankruptcy-application.dto'
import { BankruptcyAdvertModel } from './models/bankruptcy-advert.model'
import { BankruptcyApplicationModel } from './models/bankruptcy-application.model'
import { BankruptcyLocationModel } from './models/bankruptcy-location.model'

@Controller({
  path: 'adverts/bankruptcy',
  version: '1',
})
@UseGuards(TokenJwtAuthGuard)
export class BankruptcyAdvertController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(BankruptcyApplicationModel)
    private readonly bankruptcyApplicationModel: typeof BankruptcyApplicationModel,
  ) {}

  @Post('application')
  @LGResponse({ operationId: 'createBankruptcyApplication', status: 201 })
  async createBankruptcyApplication(@CurrentUser() user: Auth) {
    if (!user?.nationalId) {
      this.logger.warn('Unauthorized access attempt to create draft advert', {
        context: 'BankruptcyAdvertController',
        user,
      })

      throw new UnauthorizedException('User not authenticated')
    }

    await this.bankruptcyApplicationModel.create()
  }

  @Patch('application/')
  @LGResponse({ operationId: 'updateBankruptcyApplication', status: 200 })
  async updateBankruptcyApplication(
    @CurrentUser() user: Auth,
    @Body() body: UpdateBankruptcyApplicationDto,
  ) {
    if (!user?.nationalId) {
      this.logger.warn('Unauthorized access attempt to update draft advert', {
        context: 'BankruptcyAdvertController',
        user,
      })

      throw new UnauthorizedException('User not authenticated')
    }

    await this.bankruptcyApplicationModel.updateFromDto(body.caseId, body)
  }

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
        location: {
          ...body.bankruptcyAdvert.location,
          deadline: new Date(body.bankruptcyAdvert.location.deadline),
        },
      },
    }

    const newAdvert = await this.advertModel.create(args, {
      returning: true,
      include: [
        {
          model: BankruptcyAdvertModel,
          include: [{ model: BankruptcyLocationModel }],
        },
      ],
    })

    return newAdvert.fromModelDetailed()
  }
}
