
import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import {
  TypesWithCategoriesResponseDto,
  TypeWithCategoriesQueryDto,
  TypeWithCategoriesResponseDto,
} from '../../models/type-categories.model'
import { ITypeCategoriesService } from './type-categories.service.interface'

// TODO: Determine usage - currently no tRPC routers call this controller
// By default controllers that are not used, will have admin API only access
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@Controller({
  path: 'type-categories',
  version: '1',
})
export class TypeWithCategoriesController {
  constructor(
    @Inject(ITypeCategoriesService)
    private readonly typeCategoriesService: ITypeCategoriesService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getTypeCategories',
    type: TypesWithCategoriesResponseDto,
  })
  getTypeCategories(@Query() query: TypeWithCategoriesQueryDto) {
    return this.typeCategoriesService.findAll(query)
  }

  @Get('category/:categoryId')
  @LGResponse({
    operationId: 'getTypeCategoriesByCategoryId',
    type: TypesWithCategoriesResponseDto,
  })
  getTypeCategoriesByCategoryId(
    @Param('categoryId', new UUIDValidationPipe()) categoryId: string,
  ) {
    return this.typeCategoriesService.findByCategoryId(categoryId)
  }

  @Get('type/:typeId')
  @LGResponse({
    operationId: 'getTypeCategoriesByTypeId',
    type: TypeWithCategoriesResponseDto,
  })
  getTypeCategoriesByTypeId(
    @Param('typeId', new UUIDValidationPipe()) typeId: string,
  ) {
    return this.typeCategoriesService.findByTypeId(typeId)
  }
}
