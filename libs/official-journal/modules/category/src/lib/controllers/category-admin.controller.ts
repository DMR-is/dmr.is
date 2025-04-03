import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
} from '@nestjs/swagger'
import { UserRoleEnum } from '@dmr.is/constants'
import { TokenJwtAuthGuard } from '@dmr.is/shared/guards/token-auth.guard'
import { Roles } from '@dmr.is/decorators'
import { ResultWrapper } from '@dmr.is/types'
import { CreateMainCategoryCategories } from '../dto/create-main-category-categories.dto'
import {
  CreateMainCategory,
  CreateCategory,
  UpdateCategory,
} from '../dto/create-main-category.dto'
import { UpdateMainCategory } from '../dto/update-main-category.dto'
import { ICategoryService } from '../category.service.interface'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
@Controller({
  path: 'categories',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class CategoryAdminController {
  constructor(
    @Inject(ICategoryService)
    private readonly categoryService: ICategoryService,
  ) {}

  @Delete('main-categories/:id')
  @ApiOperation({ operationId: 'deleteMainCategory' })
  @ApiNoContentResponse()
  async deleteMainCategory(@Param('id', new UUIDValidationPipe()) id: string) {
    ResultWrapper.unwrap(await this.categoryService.deleteMainCategory(id))
  }

  @Delete('main-categories/:mainCategoryId/categories/:categoryId')
  @ApiOperation({ operationId: 'deleteMainCategoryCategory' })
  @ApiNoContentResponse()
  async deleteMainCategoryCategory(
    @Param('mainCategoryId', new UUIDValidationPipe()) mainCategoryId: string,
    @Param('categoryId', new UUIDValidationPipe()) categoryId: string,
  ) {
    ResultWrapper.unwrap(
      await this.categoryService.deleteMainCategoryCategory(
        mainCategoryId,
        categoryId,
      ),
    )
  }

  @Post('main-categories')
  @ApiOperation({ operationId: 'createMainCategory' })
  @ApiNoContentResponse()
  async createMainCategory(@Body() body: CreateMainCategory) {
    ResultWrapper.unwrap(
      await this.categoryService.insertMainCategory({
        categories: body.categories,
        title: body.title,
        description: body.description,
        departmentId: body.departmentId,
      }),
    )
  }

  @Post('categories')
  @ApiOperation({ operationId: 'createCategory' })
  @ApiNoContentResponse()
  async createCategory(@Body() body: CreateCategory) {
    ResultWrapper.unwrap(await this.categoryService.insertCategory(body.title))
  }

  @Put('categories/:id')
  @ApiOperation({ operationId: 'updateCategory' })
  @ApiNoContentResponse()
  async updateCategory(@Param('id') id: string, @Body() body: UpdateCategory) {
    ResultWrapper.unwrap(await this.categoryService.updateCategory(id, body))
  }

  @Delete('categories/:id')
  @ApiOperation({ operationId: 'deleteCategory' })
  @ApiNoContentResponse()
  async deleteCategory(@Param('id') id: string) {
    ResultWrapper.unwrap(await this.categoryService.deleteCategory(id))
  }

  @Post('main-categories/:mainCategoryId/categories')
  @ApiOperation({ operationId: 'createMainCategoryCategories' })
  @ApiNoContentResponse()
  async createMainCategoryCategories(
    @Param('mainCategoryId', new UUIDValidationPipe()) mainCategoryId: string,
    @Body() body: CreateMainCategoryCategories,
  ) {
    ResultWrapper.unwrap(
      await this.categoryService.insertMainCategoryCategories(
        mainCategoryId,
        body.categories,
      ),
    )
  }

  @Put('main-categories/:id')
  @ApiOperation({ operationId: 'updateMainCategory' })
  @ApiNoContentResponse()
  async updateMainCategory(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateMainCategory,
  ) {
    ResultWrapper.unwrap(
      await this.categoryService.updateMainCategory(id, body),
    )
  }
}
