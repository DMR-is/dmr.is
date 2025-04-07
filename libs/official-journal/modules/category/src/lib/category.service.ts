import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import slugify from 'slugify'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertCategoryCategoriesModel,
  AdvertCategoryModel,
  AdvertMainCategoryModel,
} from '@dmr.is/official-journal/models'
import { DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  CreateMainCategory,
  UpdateCategory,
} from './dto/create-main-category.dto'
import { GetCategoriesResponse } from './dto/get-categories-responses.dto'
import { GetCategoryResponse } from './dto/get-category-responses.dto'
import { GetMainCategoriesResponse } from './dto/get-main-categories-response.dto'
import { GetMainCategoryResponse } from './dto/get-main-category-response.dto'
import { UpdateMainCategory } from './dto/update-main-category.dto'
import { advertCategoryMigrate } from './migrations/advert-category.migrate'
import { advertMainCategoryMigrate } from './migrations/advert-main-category.migrate'
import { ICategoryService } from './category.service.interface'

const LOGGING_CONTEXT = 'CategoryService'
const LOGGING_CATEGORY = 'category-service'

@Injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertCategoryModel)
    private readonly advertCategoryModel: typeof AdvertCategoryModel,
    @InjectModel(AdvertMainCategoryModel)
    private readonly advertMainCategoryModel: typeof AdvertMainCategoryModel,
    @InjectModel(AdvertCategoryCategoriesModel)
    private readonly advertCategoryCategoriesModel: typeof AdvertCategoryModel,
    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  async getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!id) {
      throw new BadRequestException()
    }

    const category = await this.advertCategoryModel.findOne({
      where: { id },
      include: AdvertMainCategoryModel,
    })

    if (!category) {
      throw new NotFoundException(`Category<${id}> not found`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogAndHandle()
  async getCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const whereParams = {}

    if (params?.search) {
      Object.assign(whereParams, {
        title: { [Op.iLike]: `%${params.search}%` },
      })
    }

    if (params?.ids) {
      Object.assign(whereParams, {
        id: params.ids,
      })
    }

    const categories = await this.advertCategoryModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['title', 'ASC']],
      where: whereParams,
      include: [
        {
          model: AdvertMainCategoryModel,
          through: {
            attributes: ['advert_main_category_id', 'advert_category_id'],
          },
        },
      ],
    })

    const mapped = categories.rows.map((item) => advertCategoryMigrate(item))

    const paging = generatePaging(mapped, page, pageSize, categories.count)

    return ResultWrapper.ok({
      categories: mapped,
      paging,
    })
  }

  @LogAndHandle()
  @Transactional()
  async insertMainCategory(
    model: CreateMainCategory,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    if (!model) {
      throw new BadRequestException()
    }

    const newMainCatId = uuid()

    const mainCategory = await this.advertMainCategoryModel.create(
      {
        id: newMainCatId,
        title: model.title,
        slug: slugify(model.title, { lower: true }),
        description: model.description,
        departmentId: model.departmentId,
      },
      {
        transaction,
      },
    )

    const relations = await this.advertCategoryCategoriesModel.bulkCreate(
      model.categories.map((id) => ({
        mainCategoryId: newMainCatId,
        categoryId: id,
      })),
      { transaction },
    )

    await Promise.all(relations)

    return ResultWrapper.ok({
      mainCategory: advertMainCategoryMigrate(mainCategory),
    })
  }

  @LogAndHandle()
  async deleteMainCategory(id: string): Promise<ResultWrapper> {
    if (!id) {
      return ResultWrapper.err({
        message: 'No id provided',
        code: 400,
      })
    }

    const mainCategory = await this.advertMainCategoryModel.findByPk(id)

    const relations = await this.advertCategoryCategoriesModel.findAll({
      where: { mainCategoryId: id },
    })

    await Promise.all(relations.map((r) => r.destroy()))

    if (!mainCategory) {
      this.logger.warn(`Delete main category<${id}> not found`, {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      return ResultWrapper.err({
        message: `Main category<${id}> not found`,
        code: 404,
      })
    }

    await mainCategory.destroy()

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async deleteMainCategoryCategory(
    mainCategoryId: string,
    categoryId: string,
  ): Promise<ResultWrapper> {
    await this.advertCategoryCategoriesModel.destroy({
      where: { mainCategoryId, categoryId },
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async insertMainCategoryCategories(
    mainCategoryId: string,
    categoryIds: string[],
  ): Promise<ResultWrapper> {
    const promises = categoryIds.map((id) =>
      this.advertCategoryCategoriesModel.create({
        mainCategoryId: mainCategoryId,
        categoryId: id,
      }),
    )

    await Promise.all(promises)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateMainCategory(
    id: string,
    body: UpdateMainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>> {
    const updateTransaction = await this.sequelize.transaction()
    try {
      const found = await this.advertMainCategoryModel.findByPk(id, {
        transaction: updateTransaction,
      })

      if (!found) {
        return ResultWrapper.err({
          message: `Main category<${id}> not found`,
          code: 404,
        })
      }

      const updateBody = {
        title: body.title ? body.title : found.title,
        slug: body.title ? slugify(body.title, { lower: true }) : found.slug,
        description: body.description ? body.description : found.description,
        departmentId: body.departmentId
          ? body.departmentId
          : found.departmentId,
      }

      await found.update(updateBody, {
        transaction: updateTransaction,
      })

      await updateTransaction.commit()
      return ResultWrapper.ok()
    } catch (error) {
      this.logger.error(`Failed to update MainCategory<${id}>`, {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        error: error,
      })
      await updateTransaction.rollback()
      return ResultWrapper.err({
        message: 'Failed to update MainCategory',
        code: 500,
      })
    }
  }

  @LogAndHandle()
  async insertCategory(
    title: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!title) {
      throw new BadRequestException()
    }

    const slug = slugify(title, { lower: true })

    const category = await this.advertCategoryModel.create(
      {
        title,
        slug,
      },
      {
        transaction,
        returning: true,
      },
    )

    return ResultWrapper.ok({ category: advertCategoryMigrate(category) })
  }

  @LogAndHandle()
  async deleteCategory(id: string): Promise<ResultWrapper> {
    if (!id) {
      return ResultWrapper.err({
        message: 'No id provided',
        code: 400,
      })
    }

    await this.advertCategoryModel.destroy({ where: { id } })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateCategory(
    id: string,
    model: UpdateCategory,
  ): Promise<ResultWrapper<GetCategoryResponse>> {
    if (!model || !model.title) {
      throw new BadRequestException()
    }

    const slug = slugify(model.title, { lower: true })
    const category = await this.advertCategoryModel.update(
      {
        title: model.title,
        slug,
      },
      { where: { id: id }, returning: true },
    )

    if (!category) {
      throw new NotFoundException(`Category<${id}> not found`)
    }

    return ResultWrapper.ok({ category: advertCategoryMigrate(category[1][0]) })
  }

  @LogAndHandle()
  async getMainCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const whereParams = {}

    if (params?.search) {
      Object.assign(whereParams, {
        title: { [Op.iLike]: `%${params.search}%` },
      })
    }

    const mainCategories = await this.advertMainCategoryModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      where: whereParams,
      include: [AdvertCategoryModel],
    })

    const mapped = mainCategories.rows.map((cat) =>
      advertMainCategoryMigrate(cat),
    )
    const paging = generatePaging(mapped, page, pageSize, mainCategories.count)

    return ResultWrapper.ok({
      mainCategories: mapped,
      paging,
    })
  }
}
