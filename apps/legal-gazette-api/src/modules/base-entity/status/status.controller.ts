import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import {
  GetStatusesDto,
  StatusDto,
  StatusModel,
} from '../../../models/status.model'

@Controller({
  path: 'statuses',
  version: '1',
})
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

  @Get(':id')
  @LGResponse({ operationId: 'getStatus', type: StatusDto })
  async findById(@Param('id') id: string): Promise<StatusDto> {
    const model = await this.statusModel.findByPk(id)

    if (!model) {
      throw new NotFoundException()
    }

    return model.fromModel()
  }

  @Get('slug/:slug')
  @LGResponse({ operationId: 'getStatusBySlug', type: StatusDto })
  async findBySlug(@Param('slug') slug: string): Promise<StatusDto> {
    const model = await this.statusModel.findOne({ where: { slug: slug } })

    if (!model) {
      throw new NotFoundException()
    }

    return model.fromModel()
  }
}
