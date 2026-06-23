import {
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { GetPostcodesQueryDto } from './dto/get-postcodes-query.dto'
import { PostcodeDto } from './dto/postcode.dto'
import { RegionDto } from './dto/region.dto'
import { ILocationService } from './location.service.interface'

@Controller({
  path: 'location',
  version: '1',
})
@ApiTags('Location')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class LocationController {
  constructor(
    @Inject(ILocationService)
    private readonly locationService: ILocationService,
  ) {}

  @Get('regions')
  @DoeResponse({ operationId: 'getRegions', type: [RegionDto] })
  async getRegions(): Promise<RegionDto[]> {
    return this.locationService.getRegions()
  }

  @Get('postcodes')
  @DoeResponse({ operationId: 'getPostcodes', type: [PostcodeDto] })
  async getPostcodes(
    @Query() query: GetPostcodesQueryDto,
  ): Promise<PostcodeDto[]> {
    return this.locationService.getPostcodes(query.regionCode)
  }
}
