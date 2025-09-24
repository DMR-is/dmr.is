import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { PagingQuery } from '@dmr.is/shared/dto'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { IPriceCalculatorService } from '../../price-calculator/price-calculator.service.interface'
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
    @Inject(IPriceCalculatorService)
    private readonly priceCalculatorService: IPriceCalculatorService,
  ) {}

  @Get('count')
  @LGResponse({
    operationId: 'getAdvertsCount',
    type: GetAdvertsStatusCounterDto,
  })
  getAdvertsCount() {
    return this.advertService.getAdvertsCount()
  }

  @Get('price/:advertId')
  @LGResponse({ operationId: 'getAdvertPrice', type: Number })
  getAdvertPrice(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
  ) {
    return this.priceCalculatorService.getPaymentData(advertId)
  }

  @Get('inprogress')
  @LGResponse({ operationId: 'getAdvertsInProgress', type: GetAdvertsDto })
  getAdvertsInProgress(@Query() query: GetAdvertsQueryDto) {
    return this.advertService.getAdvertsInProgress(query)
  }

  @Get('/completed')
  @LGResponse({ operationId: 'getCompletedAdverts', type: GetAdvertsDto })
  getCompletedAdverts(@Query() query: PagingQuery) {
    return this.advertService.getCompletedAdverts(query)
  }

  @Get()
  @LGResponse({ operationId: 'getAdverts', type: GetAdvertsDto })
  getAdverts(@Query() query: GetAdvertsQueryDto) {
    return this.advertService.getAdverts(query)
  }

  @Get(':id')
  @LGResponse({ operationId: 'getAdvertById', type: AdvertDetailedDto })
  getAdvertById(@Param('id') id: string) {
    return this.advertService.getAdvertById(id)
  }

  @Get('byCaseId/:caseId')
  @LGResponse({ operationId: 'getAdvertsByCaseId', type: GetAdvertsDto })
  getAdvertByCaseId(@Param('caseId', new UUIDValidationPipe()) caseId: string) {
    return this.advertService.getAdvertsByCaseId(caseId)
  }
}
