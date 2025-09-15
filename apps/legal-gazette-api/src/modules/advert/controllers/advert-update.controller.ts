import {
  Body,
  Controller,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiParam } from '@nestjs/swagger'

import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { AdvertUpdateGuard } from '../../../guards/advert-update.guard'
import { CategoryModel } from '../../category/category.model'
import { StatusIdEnum, StatusModel } from '../../status/status.model'
import { IAdvertService } from '../advert.service.interface'
import {
  AdvertDetailedDto,
  UpdateAdvertDto,
  UpdateAdvertPublicationDto,
} from '../dto/advert.dto'

@Controller({
  path: 'adverts/:id',
  version: '1',
})
@UseGuards(AdvertUpdateGuard)
export class AdvertUpdateController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @InjectModel(CategoryModel)
    private readonly advertCategoryModel: typeof CategoryModel,
    @InjectModel(StatusModel)
    private readonly statusModel: typeof StatusModel,
  ) {}

  @Post('ready')
  @LGResponse({ operationId: 'markAdvertAsReady' })
  markAdvertAsReady(@Param('id', new UUIDValidationPipe()) advertId: string) {
    return this.advertService.markAdvertAsReady(advertId)
  }

  @Post('submit')
  @LGResponse({ operationId: 'markAdvertAsSubmitted' })
  markAdvertAsSubmitted(
    @Param('id', new UUIDValidationPipe()) advertId: string,
  ) {
    return this.advertService.markAdvertAsSubmitted(advertId)
  }

  @Patch('category/:categoryId')
  @LGResponse({ operationId: 'updateAdvertCategory' })
  @ApiParam({ name: 'categoryId', type: String })
  async updateAdvertCategory(
    @Param('id') advertId: string,
    @Param('categoryId', new UUIDValidationPipe())
    categoryId: string,
  ): Promise<void> {
    await this.advertCategoryModel.setAdvertCategory(advertId, categoryId)
  }

  @Patch('status/:statusId')
  @ApiParam({
    enum: StatusIdEnum,
    name: 'statusId',
    enumName: 'StatusIdEnum',
  })
  @LGResponse({ operationId: 'updateAdvertStatus' })
  async updateAdvertStatus(
    @Param('id') advertId: string,
    @Param('statusId', new EnumValidationPipe(StatusIdEnum))
    statusId: StatusIdEnum,
  ): Promise<void> {
    await this.statusModel.setAdvertStatus(advertId, statusId)
  }

  @Patch()
  @LGResponse({ operationId: 'updateAdvert', type: AdvertDetailedDto })
  updateAdvert(
    @Param('id') advertId: string,
    @Body() advertUpdateDto: UpdateAdvertDto,
  ) {
    return this.advertService.updateAdvert(advertId, advertUpdateDto)
  }

  @Patch('publication/:publicationId')
  @ApiParam({ name: 'publicationId', type: String })
  @LGResponse({ operationId: 'updateAdvertPublication' })
  async updateAdvertPublication(
    @Param('id', new UUIDValidationPipe()) advertId: string,
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
    @Body() body: UpdateAdvertPublicationDto,
  ): Promise<void> {
    await this.advertService.updateAdvertPublication(
      advertId,
      publicationId,
      body,
    )
  }
}
