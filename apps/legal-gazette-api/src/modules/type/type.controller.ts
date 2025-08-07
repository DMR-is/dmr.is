import { Controller, Get, Param } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { Subscriptions } from '../../guards/subscriber/subscriber.decorator'
import { Subscription } from '../../guards/subscriber/subscriber.enum'
import { BaseEntityController } from '../base-entity/base-entity.controller'
import { GetTypesDto, TypeDto } from './dto/type.dto'
import { TypeModel } from './type.model'

@ApiBearerAuth()
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

  @Get(':id')
  @Subscriptions(Subscription.ACTIVE)
  @LGResponse({ operationId: 'getType', type: TypeModel })
  async findById(@Param('id') id: string): Promise<TypeModel> {
    return super.findById(id)
  }

  @Get()
  @Subscriptions(Subscription.INACTIVE)
  @LGResponse({ operationId: 'getTypes', type: GetTypesDto })
  async findAll(): Promise<GetTypesDto> {
    const types = await super.findAll()

    return {
      types: types,
    }
  }
}
