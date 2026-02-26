import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { ApplicationWebScopes } from '../../../core/guards/scope-guards/scopes.decorator'
import {
  CourtDistrictDto,
  CourtDistrictModel,
  GetCourtDistrictsDto,
} from '../../../models/court-district.model'
import { BaseEntityController } from '../base-entity.controller'

// Access: Admin users OR application-web users
@Controller({
  path: 'court-districts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@ApplicationWebScopes()
@AdminAccess()
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
