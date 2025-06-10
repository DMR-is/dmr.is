import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { AdvertStatusDto, GetAdvertStatusesDto } from './dto/advert-status.dto'
import { AdvertStatusModel } from './advert-status.model'

@Controller({
  path: 'statuses',
  version: '1',
})
export class AdvertStatusController {
  constructor(
    @InjectModel(AdvertStatusModel)
    private readonly advertStatusModel: typeof AdvertStatusModel,
  ) {}

  @Get('/')
  @LGResponse({ operationId: 'getAdvertStatuses', type: GetAdvertStatusesDto })
  async getStatuses(): Promise<GetAdvertStatusesDto> {
    const statuses = await this.advertStatusModel.findAll()

    const migrated = statuses.map((status) => ({
      id: status.id,
      title: status.title,
      slug: status.slug,
    }))

    return {
      statuses: migrated,
    }
  }

  @Get(':id')
  @LGResponse({ operationId: 'getAdvertStatus', type: AdvertStatusDto })
  async getStatusById(@Param('id') id: string): Promise<AdvertStatusDto> {
    const status = await this.advertStatusModel.findByPk(id)

    if (!status) {
      throw new NotFoundException(`Advert status with id ${id} not found`)
    }

    return {
      id: status.id,
      title: status.title,
      slug: status.slug,
    }
  }
}
