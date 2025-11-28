import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { ScopesGuard, TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { AdminOnly } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AdminGuard } from '../../../core/guards/admin.guard'
import {
  CreateAdvertDto,
  CreateAdvertResponseDto,
} from '../../../models/advert.model'
import { IAdvertService } from '../advert.service.interface'

@Controller({
  path: 'adverts/create',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
@AdminOnly()
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
}
