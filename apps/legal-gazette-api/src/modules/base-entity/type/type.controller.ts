import { Op, WhereOptions } from 'sequelize'

import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { PublicOrApplicationWebScopes } from '../../../core/guards/scope-guards/scopes.decorator'
import { CategoryModel } from '../../../models/category.model'
import { TypeDto, TypeModel } from '../../../models/type.model'
import {
  GetTypesDto,
  GetTypesQueryDto,
} from '../../base-entity/dto/base-entity-query.dto'
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

  @Get()
  @LGResponse({ operationId: 'getTypes', type: GetTypesDto })
  async getTypes(@Query() query?: GetTypesQueryDto): Promise<GetTypesDto> {
    const where: WhereOptions<TypeModel> = {}
    if (query?.excludeUnassignable) {
      where.active = true
    }
    if (query?.excludeTypes) {
      where.id = { [Op.notIn]: query.excludeTypes }
    }

    const types = await super.findAll({
      where: where,
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
