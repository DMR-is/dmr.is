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
import {
  ApplicationWebScopes,
  TokenJwtAuthGuard,
} from '@dmr.is/modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { PagingQuery } from '@dmr.is/shared/dto'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { OwnershipGuard } from '../../../core/guards/ownership.guard'
import {
  AdvertDetailedDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  GetMyAdvertsDto,
} from '../../../models/advert.model'
import { IAdvertService } from '../../../modules/advert/advert.service.interface'

@Controller({
  path: 'adverts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
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

  @ApplicationWebScopes()
  @Get('getMyAdverts')
  @LGResponse({ operationId: 'getMyAdverts', type: GetMyAdvertsDto })
  getMyAdverts(@Query() query: PagingQuery, @CurrentUser() user: DMRUser) {
    return this.advertService.getMyAdverts(query, user)
  }

  @ApplicationWebScopes()
  @Get('getMyLegacyAdverts')
  @LGResponse({ operationId: 'getMyLegacyAdverts', type: GetMyAdvertsDto })
  getMyLegacyAdverts(
    @Query() query: PagingQuery,
    @CurrentUser() user: DMRUser,
  ) {
    return this.advertService.getMyLegacyAdverts(query, user)
  }
  @UseGuards(OwnershipGuard)
  @Get(':advertId')
  @LGResponse({ operationId: 'getAdvertById', type: AdvertDetailedDto })
  getAdvertById(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @CurrentUser() user: DMRUser,
  ) {
    return this.advertService.getAdvertById(advertId, user)
  }

  @ApplicationWebScopes()
  @UseGuards(OwnershipGuard)
  @Get('byCaseId/:caseId')
  @LGResponse({ operationId: 'getAdvertsByCaseId', type: GetAdvertsDto })
  getAdvertByCaseId(@Param('caseId', new UUIDValidationPipe()) caseId: string) {
    return this.advertService.getAdvertsByCaseId(caseId)
  }
}
