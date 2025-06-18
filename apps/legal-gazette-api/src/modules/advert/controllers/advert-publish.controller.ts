import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiParam } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdvertModel } from '../advert.model'
import { PublishAdvertsBody } from '../dto/advert.dto'

@Controller({
  path: 'adverts',
  version: '1',
})
export class AdvertPublishController {
  constructor(
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  @Post('publish')
  @LGResponse({ operationId: 'publishAdverts' })
  async publishAdverts(@Body() body: PublishAdvertsBody) {
    for (const advertId of body.advertIds) {
      const advert = await this.advertModel.findByPk(advertId)

      if (!advert) throw new NotFoundException('Advert not found')

      await advert.publishAdvert()
    }
  }

  @Post(':id/publish')
  @ApiParam({ name: 'id', type: String })
  @LGResponse({ operationId: 'publishAdvert' })
  async publishAdvert(@Param('id', new UUIDValidationPipe()) id: string) {
    const advert = await this.advertModel.findByPk(id)

    if (!advert) throw new NotFoundException('Advert not found')

    await advert.publishAdvert()
  }
}
