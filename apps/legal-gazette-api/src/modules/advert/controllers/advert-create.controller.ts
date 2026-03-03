import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import {
  CreateAdvertDto,
  CreateAdvertResponseDto,
} from '../../../modules/advert/dto/advert.dto'
import {
  CreateCommonAdvertAndApplicationDto,
  CreateRecallBankruptcyAdvertAndApplicationDto,
  CreateRecallDeceasedAdvertAndApplicationDto,
} from '../../../modules/advert/dto/advert-application.dto'
import { IAdvertService } from '../advert.service.interface'

@Controller({
  path: 'adverts/create',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class AdvertCreateController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
  ) {}

  @Post()
  @LGResponse({ operationId: 'createAdvert', type: CreateAdvertResponseDto })
  createAdvert(
    @Body() body: CreateAdvertDto,
    @CurrentUser() user: DMRUser,
  ): Promise<CreateAdvertResponseDto> {
    return this.advertService.createAdvert({
      ...body,
      createdBy: user.fullName,
      createdByNationalId: user.nationalId,
    })
  }

  @Post('/template/common')
  @LGResponse({ operationId: 'createAdvertAndCommonApplication' })
  createAdvertAndCommonApplication(
    @Body() body: CreateCommonAdvertAndApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.advertService.createAdvertAndCommonApplication(body, user)
  }

  @Post('/template/recall-bankruptcy')
  @LGResponse({ operationId: 'createAdvertAndRecallBankruptcyApplication' })
  createAdvertAndRecallBankruptcyApplication(
    @Body() body: CreateRecallBankruptcyAdvertAndApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.advertService.createAdvertAndRecallBankruptcyApplication(
      body,
      user,
    )
  }

  @Post('/template/recall-deceased')
  @LGResponse({ operationId: 'createAdvertAndRecallDeceasedApplication' })
  createAdvertAndRecallDeceasedApplication(
    @Body() body: CreateRecallDeceasedAdvertAndApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.advertService.createAdvertAndRecallDeceasedApplication(
      body,
      user,
    )
  }
}
