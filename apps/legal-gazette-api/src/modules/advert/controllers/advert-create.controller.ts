import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import {
  CreateAdvertAndCommonApplicationBodyDto,
  CreateAdvertAndRecallBankruptcyApplicationBodyDto,
  CreateAdvertAndRecallDeceasedApplicationBodyDto,
  CreateAdvertDto,
  CreateAdvertResponseDto,
} from '../../../models/advert.model'
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
    @Body() body: CreateAdvertAndCommonApplicationBodyDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.advertService.createAdvertAndCommonApplication(body, user)
  }

  @Post('/template/recall-bankruptcy')
  @LGResponse({ operationId: 'createAdvertAndRecallBankruptcyApplication' })
  createAdvertAndRecallBankruptcyApplication(
    @Body() body: CreateAdvertAndRecallBankruptcyApplicationBodyDto,
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
    @Body() body: CreateAdvertAndRecallDeceasedApplicationBodyDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.advertService.createAdvertAndRecallDeceasedApplication(
      body,
      user,
    )
  }
}
