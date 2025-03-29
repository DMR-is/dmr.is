import { Controller, Get, Inject, Query } from '@nestjs/common'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ICategoryService } from '../category.service.interface'
import { DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GetCategoriesResponse } from '../dto/get-categories-responses.dto'
import { GetMainCategoriesResponse } from '../dto/get-main-categories-response.dto'

@Controller({
  path: 'categories',
  version: '1',
})
export class CategoryController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICategoryService)
    private readonly categoryService: ICategoryService,
  ) {}

  @Get('/maincategories')
  @ApiOperation({ operationId: 'getMainCategories' })
  @ApiResponse({ status: 200, type: GetMainCategoriesResponse })
  async mainCategories(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetMainCategoriesResponse> {
    return ResultWrapper.unwrap(
      await this.categoryService.getMainCategories(params),
    )
  }

  @Get('/categories')
  @ApiOperation({ operationId: 'getCategories' })
  @ApiResponse({ status: 200, type: GetCategoriesResponse })
  async categories(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetCategoriesResponse> {
    return ResultWrapper.unwrap(
      await this.categoryService.getCategories(params),
    )
  }
}
