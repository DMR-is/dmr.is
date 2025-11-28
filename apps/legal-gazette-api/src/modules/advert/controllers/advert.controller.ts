import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { ScopesGuard, TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdminOnly } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AdminGuard } from '../../../core/guards/admin.guard'
import {
  AdvertDetailedDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
} from '../../../models/advert.model'
import { IAdvertService } from '../../../modules/advert/advert.service.interface'

@Controller({
  path: 'adverts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
@AdminOnly()
export class AdvertController {
  constructor(
    @Inject(IAdvertService)
    private readonly advertService: IAdvertService,
  ) {}

  @Get('count')
  @LGResponse({
    operationId: 'getAdvertsCount',
    type: GetAdvertsStatusCounterDto,
  })
  getAdvertsCount() {
    return this.advertService.getAdvertsCount()
  }

  @Get()
  @LGResponse({ operationId: 'getAdverts', type: GetAdvertsDto })
  getAdverts(@Query() query: GetAdvertsQueryDto) {
    return this.advertService.getAdverts(query)
  }

  @Get(':id')
  @LGResponse({ operationId: 'getAdvertById', type: AdvertDetailedDto })
  getAdvertById(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: DMRUser,
  ) {
    return this.advertService.getAdvertById(id, user)
  }

  // Note: This endpoint is also accessible by application-web users via ApplicationWebScopes
  // The AdminGuard will allow access if user is admin OR has ApplicationWebScopes
  @Get('byCaseId/:caseId')
  @LGResponse({ operationId: 'getAdvertsByCaseId', type: GetAdvertsDto })
  getAdvertByCaseId(@Param('caseId', new UUIDValidationPipe()) caseId: string) {
    return this.advertService.getAdvertsByCaseId(caseId)
  }
}
