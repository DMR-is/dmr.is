import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { CategoryDto } from '../../models/category.model'
import { TypeDto } from '../../models/type.model'
import {
  CategoryTypeActor,
  CategoryTypeOverviewDto,
  ChangeLogQuery,
  ConnectionBody,
  CreateCategoryBody,
  CreateTypeBody,
  GetChangeLogDto,
  ImpactDto,
  MoveAdvertsBody,
  SetActiveBody,
  UpdateCategoryBody,
  UpdateTypeBody,
} from './dto/category-type-admin.dto'
import { ICategoryTypeAdminService } from './category-type-admin.service.interface'

@Controller({ path: 'category-type', version: '1' })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class CategoryTypeAdminController {
  constructor(
    @Inject(ICategoryTypeAdminService)
    private readonly service: ICategoryTypeAdminService,
  ) {}

  private actor(user: DMRUser): CategoryTypeActor {
    return { id: user.nationalId, name: user.name ?? user.fullName ?? null }
  }

  // --- Overview ---

  @Get('/overview')
  @LGResponse({
    operationId: 'getCategoryTypeOverview',
    type: CategoryTypeOverviewDto,
  })
  getOverview(): Promise<CategoryTypeOverviewDto> {
    return this.service.getOverview()
  }

  // --- Categories ---

  @Post('/categories')
  @LGResponse({ operationId: 'createCategory', type: CategoryDto })
  createCategory(
    @Body() body: CreateCategoryBody,
    @CurrentUser() user: DMRUser,
  ): Promise<CategoryDto> {
    return this.service.createCategory(body, this.actor(user))
  }

  @Put('/categories/:id')
  @LGResponse({ operationId: 'updateCategory', type: CategoryDto })
  updateCategory(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateCategoryBody,
    @CurrentUser() user: DMRUser,
  ): Promise<CategoryDto> {
    return this.service.updateCategory(id, body, this.actor(user))
  }

  @Put('/categories/:id/active')
  @LGResponse({ operationId: 'setCategoryActive', type: CategoryDto })
  setCategoryActive(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: SetActiveBody,
    @CurrentUser() user: DMRUser,
  ): Promise<CategoryDto> {
    return this.service.setCategoryActive(id, body, this.actor(user))
  }

  @Get('/categories/:id/impact')
  @LGResponse({ operationId: 'getCategoryImpact', type: ImpactDto })
  getCategoryImpact(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<ImpactDto> {
    return this.service.getCategoryImpact(id)
  }

  @Delete('/categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @LGResponse({ operationId: 'deleteCategory' })
  deleteCategory(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.service.deleteCategory(id, this.actor(user))
  }

  // --- Types ---

  @Post('/types')
  @LGResponse({ operationId: 'createType', type: TypeDto })
  createType(
    @Body() body: CreateTypeBody,
    @CurrentUser() user: DMRUser,
  ): Promise<TypeDto> {
    return this.service.createType(body, this.actor(user))
  }

  @Put('/types/:id')
  @LGResponse({ operationId: 'updateType', type: TypeDto })
  updateType(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateTypeBody,
    @CurrentUser() user: DMRUser,
  ): Promise<TypeDto> {
    return this.service.updateType(id, body, this.actor(user))
  }

  @Put('/types/:id/active')
  @LGResponse({ operationId: 'setTypeActive', type: TypeDto })
  setTypeActive(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: SetActiveBody,
    @CurrentUser() user: DMRUser,
  ): Promise<TypeDto> {
    return this.service.setTypeActive(id, body, this.actor(user))
  }

  @Get('/types/:id/impact')
  @LGResponse({ operationId: 'getTypeImpact', type: ImpactDto })
  getTypeImpact(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<ImpactDto> {
    return this.service.getTypeImpact(id)
  }

  @Delete('/types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @LGResponse({ operationId: 'deleteType' })
  deleteType(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.service.deleteType(id, this.actor(user))
  }

  // --- Connections ---

  @Post('/connections')
  @HttpCode(HttpStatus.NO_CONTENT)
  @LGResponse({ operationId: 'attachTypeCategory' })
  attach(
    @Body() body: ConnectionBody,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.service.attach(body, this.actor(user))
  }

  @Post('/connections/detach')
  @HttpCode(HttpStatus.NO_CONTENT)
  @LGResponse({ operationId: 'detachTypeCategory' })
  detach(
    @Body() body: ConnectionBody,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.service.detach(body, this.actor(user))
  }

  // --- Bulk moves ---

  @Post('/moves/impact')
  @LGResponse({ operationId: 'getMoveImpact', type: ImpactDto })
  getMoveImpact(@Body() body: MoveAdvertsBody): Promise<ImpactDto> {
    return this.service.getMoveImpact(body)
  }

  @Post('/moves')
  @LGResponse({ operationId: 'moveAdverts', type: ImpactDto })
  moveAdverts(
    @Body() body: MoveAdvertsBody,
    @CurrentUser() user: DMRUser,
  ): Promise<ImpactDto> {
    return this.service.moveAdverts(body, this.actor(user))
  }

  // --- Audit + undo ---

  @Get('/change-log')
  @LGResponse({ operationId: 'getCategoryTypeChangeLog', type: GetChangeLogDto })
  getChangeLog(@Query() query: ChangeLogQuery): Promise<GetChangeLogDto> {
    return this.service.getChangeLog(query)
  }

  @Post('/change-log/:id/revert')
  @HttpCode(HttpStatus.NO_CONTENT)
  @LGResponse({ operationId: 'revertCategoryTypeChange' })
  revert(
    @Param('id', new UUIDValidationPipe()) id: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.service.revert(id, this.actor(user))
  }
}
