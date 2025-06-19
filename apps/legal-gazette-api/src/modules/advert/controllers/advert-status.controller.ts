import { Controller, Param, Patch } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiParam } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { EnumValidationPipe } from '@dmr.is/pipelines'

import { StatusIdEnum, StatusModel } from '../../status/status.model'

@Controller({
  path: 'advert/:id/status',
})
export class AdvertStatusController {
  constructor(
    @InjectModel(StatusModel)
    private readonly statusModel: typeof StatusModel,
  ) {}

  @Patch(':statusId')
  @ApiParam({
    enum: StatusIdEnum,
    name: 'statusId',
    enumName: 'StatusIdEnum',
  })
  @LGResponse({ operationId: 'updateAdvertStatus' })
  async updateAdvertStatus(
    @Param('id') id: string,
    @Param('statusId', new EnumValidationPipe(StatusIdEnum))
    statusId: StatusIdEnum,
  ): Promise<void> {
    await this.statusModel.setAdvertStatus(id, statusId)
  }
}
