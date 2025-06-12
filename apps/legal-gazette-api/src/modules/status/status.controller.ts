import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { GetStatusesDto, StatusDto } from './dto/status.dto'
import { StatusModel } from './status.model'

@Controller({
  path: 'statuses',
  version: '1',
})
export class StatusController {
  constructor(
    @InjectModel(StatusModel)
    private readonly statusModel: typeof StatusModel,
  ) {}

  @Get('/')
  @LGResponse({ operationId: 'getStatuses', type: GetStatusesDto })
  async getStatuses(): Promise<GetStatusesDto> {
    const statuses = await this.statusModel.findAll()

    const migrated = this.statusModel.fromModels(statuses)

    return {
      statuses: migrated,
    }
  }

  @Get(':id')
  @LGResponse({ operationId: 'getStatus', type: StatusDto })
  async getStatusById(@Param('id') id: string): Promise<StatusDto> {
    const status = await this.statusModel.findByPk(id)

    if (!status) {
      throw new NotFoundException(`Status not found`)
    }

    return {
      id: status.id,
      title: status.title,
      slug: status.slug,
    }
  }
}
