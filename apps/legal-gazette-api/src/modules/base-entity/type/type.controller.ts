import { Op } from 'sequelize'

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import {
  COMMON_ADVERT_TYPES_IDS,
  UNASSIGNABLE_TYPE_IDS,
} from '../../../core/constants'
import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { PublicOrApplicationWebScopes } from '../../../core/guards/scope-guards/scopes.decorator'
import { CategoryModel } from '../../../models/category.model'
import {
  GetTypesDto,
  GetTypesQueryDto,
  TypeDto,
  TypeModel,
} from '../../../models/type.model'
import { BaseEntityController } from '../base-entity.controller'

// Access: Admin users OR public-web users OR application-web users
@Controller({ path: 'types', version: '1' })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@PublicOrApplicationWebScopes()
@AdminAccess()
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
  async getTypes(@Query() query?: GetTypesQueryDto): Promise<GetTypesDto> {
    const types = await super.findAll({
      where: query?.excludeUnassignable
        ? {
            id: { [Op.notIn]: UNASSIGNABLE_TYPE_IDS },
          }
        : undefined,
      include: [
        {
          model: CategoryModel,
          where: query?.category ? { id: query.category } : undefined,
        },
      ],
    })

    return {
      types: types,
    }
  }
}
