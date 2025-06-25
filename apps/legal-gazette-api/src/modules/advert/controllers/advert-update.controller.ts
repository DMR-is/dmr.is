import { Body, Controller, Inject, Param, Patch } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiParam } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { CategoryModel } from '../../category/category.model'
import { StatusIdEnum, StatusModel } from '../../status/status.model'
import { IAdvertService } from '../advert.service.interface'
import { AdvertDto, UpdateAdvertDto } from '../dto/advert.dto'

@Controller({
  path: 'advert/:id',
})
export class AdvertUpdateController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @InjectModel(CategoryModel)
    private readonly advertCategoryModel: typeof CategoryModel,
    @InjectModel(StatusModel)
    private readonly statusModel: typeof StatusModel,
  ) {}

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
  @LGResponse({ operationId: 'updateAdvert', type: AdvertDto })
  updateAdvert(
    @Param('id') advertId: string,
    @Body() advertUpdateDto: UpdateAdvertDto,
  ) {
    return this.advertService.updateAdvert(advertId, advertUpdateDto)
  }
}
