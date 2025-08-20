import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { AdvertUpdateGuard } from '../../../guards/advert-update.guard'
import { AdvertModel } from '../advert.model'
import { CommonAdvertModel } from '../common/common-advert.model'
import { CommonAdvertDto } from '../common/dto/common-advert.dto'
import { UpdateCommonAdvertDto } from '../common/dto/update-common-advert.dto'

@Controller({
  path: 'adverts/common',
  version: '1',
})
@UseGuards(AdvertUpdateGuard)
export class CommonAdvertController {
  constructor(
    @InjectModel(AdvertModel)
    private readonly advertModel: typeof AdvertModel,
  ) {}

  @Patch(':id')
  @LGResponse({ operationId: 'updateCommonAdvert', type: CommonAdvertDto })
  async updateCommonAdvert(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCommonAdvertDto,
  ): Promise<CommonAdvertDto> {
    const advert = await this.advertModel
      .unscoped()
      .findByPk(id, { include: [CommonAdvertModel] })

    if (!advert || !advert.commonAdvert) {
      throw new NotFoundException('Advert not found')
    }

    if (body.html) {
      await advert.update({ html: body.html })
    }

    const updatedAdvert = await advert.commonAdvert.update({
      caption: body.caption,
    })

    return CommonAdvertModel.fromModel(updatedAdvert)
  }
}
