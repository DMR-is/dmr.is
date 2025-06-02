import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import {
  BaseEntityDetailedDto,
  baseEntityDetailedMigrate,
  BaseEntityDto,
  migrate,
} from '@dmr.is/legal-gazette/dto'

import {
  AdvertStatusDetailedDto,
  AdvertStatusDto,
  GetAdvertStatusesDetailedDto,
  GetAdvertStatusesDto,
} from './dto/advert-status.dto'
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
  async getCasesStatuses(): Promise<GetAdvertStatusesDto> {
    const statuses = await this.advertStatusModel.findAll()

    const migrated = statuses.map((status) =>
      migrate<BaseEntityDto>({
        model: status,
      }),
    )

    return {
      statuses: migrated,
    }
  }

  @Get('/detailed')
  @LGResponse({
    operationId: 'getAdvertStatusesDetailed',
    type: GetAdvertStatusesDetailedDto,
  })
  async getCasesStatusesDetailed(): Promise<GetAdvertStatusesDetailedDto> {
    const statuses = await this.advertStatusModel.scope('detailed').findAll()

    const migrated = statuses.map((status) =>
      migrate<BaseEntityDetailedDto>({
        model: status,
        defaultMigration: baseEntityDetailedMigrate,
      }),
    )

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

    const migrated = migrate<BaseEntityDto>({
      model: status,
    })

    return migrated
  }

  @Get(':id/detailed')
  @LGResponse({
    operationId: 'getAdvertStatusDetailed',
    type: AdvertStatusDetailedDto,
  })
  async getStatusDetailedById(
    @Param('id') id: string,
  ): Promise<AdvertStatusDetailedDto> {
    const status = await this.advertStatusModel.scope('detailed').findByPk(id)

    if (!status) {
      throw new NotFoundException(`Advert status with id ${id} not found`)
    }

    const migrated = migrate<BaseEntityDetailedDto>({
      model: status,
      defaultMigration: baseEntityDetailedMigrate,
    })

    return migrated
  }
}
