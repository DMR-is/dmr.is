import { Controller, Get, Param } from '@nestjs/common'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import {
  CourtDistrictDto,
  CourtDistrictModel,
  GetCourtDistrictsDto,
} from '../../../models/court-district.model'
import { BaseEntityController } from '../base-entity.controller'

@Controller({
  path: 'court-districts',
  version: '1',
})
export class CourtDistrictController extends BaseEntityController<
  typeof CourtDistrictModel,
  CourtDistrictDto
> {
  constructor() {
    super(CourtDistrictModel)
  }

  @Get()
  @LGResponse({ operationId: 'getCourtDistricts', type: GetCourtDistrictsDto })
  async findAll(): Promise<GetCourtDistrictsDto> {
    const courtDistricts = await super.findAll()

    return {
      courtDistricts: courtDistricts,
    }
  }

  @Get(':id')
  @LGResponse({ operationId: 'getCourtDistrictById', type: CourtDistrictDto })
  findById(@Param('id') id: string): Promise<CourtDistrictDto> {
    return super.findById(id)
  }

  @Get('slug/:slug')
  @LGResponse({ operationId: 'getCourtDistrictBySlug', type: CourtDistrictDto })
  findBySlug(@Param('slug') slug: string): Promise<CourtDistrictDto> {
    return super.findBySlug(slug)
  }
}
