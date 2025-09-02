import {
  Body,
  Controller,
  NotFoundException,
  NotImplementedException,
  Param,
  Post,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiParam } from '@nestjs/swagger'

import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../decorators/lg-response.decorator'
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
    throw new NotImplementedException()
  }

  @Post(':id/publish')
  @ApiParam({ name: 'id', type: String })
  @LGResponse({ operationId: 'publishAdvert' })
  async publishAdvert(@Param('id', new UUIDValidationPipe()) id: string) {
    throw new NotImplementedException()
  }
}
