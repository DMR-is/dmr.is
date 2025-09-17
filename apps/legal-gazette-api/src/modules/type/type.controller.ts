import { Op } from 'sequelize'

import { Controller, Get, Param } from '@nestjs/common'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { COMMON_ADVERT_TYPES_IDS } from '../../lib/constants'
import { BaseEntityController } from '../base-entity/base-entity.controller'
import { GetTypesDto, TypeDto } from './dto/type.dto'
import { TypeModel } from './type.model'

@Controller({ path: 'types', version: '1' })
export class TypeController extends BaseEntityController<
  typeof TypeModel,
  TypeDto
> {
  constructor() {
    super(TypeModel)
  }

  @Get('slug/:slug')
  @LGResponse({ operationId: 'getTypeBySlug', type: TypeModel })
  async findBySlug(@Param('slug') slug: string): Promise<TypeModel> {
    return super.findBySlug(slug)
  }

  @Get('common')
  @LGResponse({ operationId: 'getCommonAdvertTypes', type: GetTypesDto })
  async getCommonAdvertTypes(): Promise<GetTypesDto> {
    const types = await this.model.findAll({
      where: { id: { [Op.in]: COMMON_ADVERT_TYPES_IDS } },
    })

    return {
      types: types,
    }
  }

  @Get(':id')
  @LGResponse({ operationId: 'getType', type: TypeModel })
  async findById(@Param('id') id: string): Promise<TypeModel> {
    return super.findById(id)
  }

  @Get()
  @LGResponse({ operationId: 'getTypes', type: GetTypesDto })
  async findAll(): Promise<GetTypesDto> {
    const types = await super.findAll()

    return {
      types: types,
    }
  }
}
