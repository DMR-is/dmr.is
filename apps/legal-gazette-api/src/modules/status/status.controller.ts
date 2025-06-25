import { Controller, Get, Param } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { BaseEntityController } from '../base-entity/base-entity.controller'
import { GetStatusesDto, StatusDto } from './dto/status.dto'
import { StatusModel } from './status.model'

@Controller({
  path: 'statuses',
  version: '1',
})
export class StatusController extends BaseEntityController<typeof StatusModel> {
  constructor() {
    super(StatusModel)
  }

  @Get('/')
  @LGResponse({ operationId: 'getStatuses', type: GetStatusesDto })
  async findAll(): Promise<GetStatusesDto> {
    const statuses = await super.findAll()

    return {
      statuses: statuses,
    }
  }

  @Get(':id')
  @LGResponse({ operationId: 'getStatus', type: StatusDto })
  async findById(@Param('id') id: string): Promise<StatusDto> {
    return super.findById(id)
  }

  @Get('slug/:slug')
  @LGResponse({ operationId: 'getStatusBySlug', type: StatusDto })
  async findBySlug(@Param('slug') slug: string): Promise<StatusDto> {
    return super.findBySlug(slug)
  }
}
