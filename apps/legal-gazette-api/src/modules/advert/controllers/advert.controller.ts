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
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { IAdvertService } from '../advert.service.interface'
import {
  AdvertDetailedDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
} from '../dto/advert.dto'

@Controller({
  path: 'adverts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class AdvertController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
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
  getAdvertById(@Param('id', new UUIDValidationPipe()) id: string, @CurrentUser() user: DMRUser) {
    return this.advertService.getAdvertById(id, user)
  }

  @Get('byCaseId/:caseId')
  @LGResponse({ operationId: 'getAdvertsByCaseId', type: GetAdvertsDto })
  getAdvertByCaseId(@Param('caseId', new UUIDValidationPipe()) caseId: string) {
    return this.advertService.getAdvertsByCaseId(caseId)
  }
}
