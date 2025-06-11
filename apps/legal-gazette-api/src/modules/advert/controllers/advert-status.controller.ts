import { Controller, Param, Patch } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiParam } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { EnumValidationPipe } from '@dmr.is/pipelines'

import {
  AdvertStatusIdEnum,
  AdvertStatusModel,
} from '../../advert-status/advert-status.model'

@Controller({
  path: 'advert:id/status',
})
export class AdvertStatusController {
  constructor(
    @InjectModel(AdvertStatusModel)
    private readonly advertStatusModel: typeof AdvertStatusModel,
  ) {}

  @Patch()
  @ApiParam({
    enum: AdvertStatusIdEnum,
    name: 'statusId',
    enumName: 'AdvertStatusIdEnum',
  })
  @LGResponse({ operationId: 'updateAdvertStatus' })
  async updateAdvertStatus(
    @Param('id') id: string,
    @Param('statusId', new EnumValidationPipe(AdvertStatusIdEnum))
    statusId: AdvertStatusIdEnum,
  ): Promise<void> {
    await this.advertStatusModel.setAdvertStatus(id, statusId)
  }
}
