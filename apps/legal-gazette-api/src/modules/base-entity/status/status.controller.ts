import { Controller, Get, UseGuards } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { StatusModel } from '../../../models/status.model'
import { GetStatusesDto } from '../../base-entity/dto/base-entity-query.dto'

@Controller({
  path: 'statuses',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class StatusController {
  constructor(
    @InjectModel(StatusModel) private readonly statusModel: typeof StatusModel,
  ) {}

  @Get('/')
  @LGResponse({ operationId: 'getStatuses', type: GetStatusesDto })
  async findAll(): Promise<GetStatusesDto> {
    const statuses = await this.statusModel.findAll()

    return {
      statuses: statuses.map((status) => status.fromModel()),
    }
  }
}
