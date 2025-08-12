import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdvertUpdateGuard } from '../../../guards/advert-update.guard'
import { CommonAdvertModel } from '../common-advert/common-advert.model'
import { CommonAdvertDto } from '../common-advert/dto/common-advert.dto'
import { UpdateCommonAdvertDto } from '../common-advert/dto/update-common-advert.dto'
import { AdvertModel } from '../advert.model'

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

    if (body.html || body.caption) {
      await advert.update({ html: body.html, title: body.caption })
    }

    const updatedAdvert = await advert.commonAdvert.update({
      caption: body.caption,
      signatureName: body.signature?.name,
      signatureLocation: body.signature?.location,
      signatureDate: body?.signature?.date
        ? new Date(body.signature.date)
        : undefined,
    })

    return CommonAdvertModel.fromModel(updatedAdvert)
  }
}
