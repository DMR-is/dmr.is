import { Controller, Get, Inject } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { BaseEntityController } from '../base-entity/base-entity.controller'
import { GetTypesDto } from './dto/type.dto'
import { TypeModel } from './type.model'

@Controller({ path: 'types', version: '1' })
export class TypeController extends BaseEntityController<typeof TypeModel> {
  constructor() {
    super(TypeModel)
  }

  @Get('slug/:slug')
  @LGResponse({ operationId: 'getTypeBySlug', type: TypeModel })
  async findBySlug(@Inject('slug') slug: string): Promise<TypeModel> {
    return super.findBySlug(slug)
  }

  @Get(':id')
  @LGResponse({ operationId: 'getType', type: TypeModel })
  async findById(@Inject('id') id: string): Promise<TypeModel> {
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
