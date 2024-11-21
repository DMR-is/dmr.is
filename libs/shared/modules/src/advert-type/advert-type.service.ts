import { Sequelize } from 'sequelize-typescript'
import slugify from 'slugify'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IAdvertTypeService } from './advert-type.service.interface'
import {
  AdvertTypeQuery,
  CreateAdvertTypeBody,
  CreateMainAdvertTypeBody,
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
  UpdateAdvertTypeBody,
  UpdateMainAdvertTypeBody,
} from './dto'
import { advertMainTypeMigrate, advertTypeMigrate } from './migrations'
import {
  AdvertDepartmentModel,
  AdvertMainTypeModel,
  AdvertTypeModelNew,
} from './models'
import {
  getAdvertTypeDepartmentWhereParams,
  getAdvertTypeWhereParams,
} from './utils'

const LOGGING_CATEGORY = 'advert-type-service'

@Injectable()
export class AdvertTypeService implements IAdvertTypeService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertTypeModelNew)
    private readonly advertTypeModel: typeof AdvertTypeModelNew,
    @InjectModel(AdvertMainTypeModel)
    private readonly advertMainTypeModel: typeof AdvertMainTypeModel,
    private sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  async getTypes(
    query?: AdvertTypeQuery,
  ): Promise<ResultWrapper<GetAdvertTypes>> {
    const whereParams = getAdvertTypeWhereParams(query)
    const departmentWhereParams = getAdvertTypeDepartmentWhereParams(
      query?.department,
    )

    const offset = query?.page || DEFAULT_PAGE_NUMBER
    const limit = query?.pageSize || DEFAULT_PAGE_SIZE

    const typesLookup = await this.advertTypeModel.findAndCountAll({
      distinct: true,
      limit: limit,
      offset: offset,
      where: whereParams,
      include: [
        {
          model: AdvertMainTypeModel,
          include: [
            {
              model: AdvertDepartmentModel,
              where: departmentWhereParams,
            },
          ],
        },
      ],
    })

    const mapped = typesLookup.rows.map(advertTypeMigrate)
    const paging = generatePaging(mapped, offset, limit, typesLookup.count)

    return ResultWrapper.ok({
      types: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getMainTypes(
    query?: AdvertTypeQuery,
  ): Promise<ResultWrapper<GetAdvertMainTypes>> {
    const offset = query?.page || DEFAULT_PAGE_NUMBER
    const limit = query?.pageSize || DEFAULT_PAGE_SIZE

    const whereParams = getAdvertTypeWhereParams(query)
    const departmentWhereParams = getAdvertTypeDepartmentWhereParams(
      query?.department,
    )

    const mainTypesLookup = await this.advertMainTypeModel.findAndCountAll({
      distinct: true,
      limit: limit,
      offset: offset,
      where: whereParams,
      include: [
        {
          model: AdvertTypeModelNew,
        },
        {
          model: AdvertDepartmentModel,
          where: departmentWhereParams,
        },
      ],
    })

    const mapped = mainTypesLookup.rows.map(advertMainTypeMigrate)
    const paging = generatePaging(mapped, offset, limit, mainTypesLookup.count)

    return ResultWrapper.ok({
      mainTypes: mapped,
      paging,
    })
  }

  @LogAndHandle()
  async getTypeById(id: string): Promise<ResultWrapper<GetAdvertType>> {
    const type = await this.advertTypeModel.findByPk(id)

    if (!type) {
      return ResultWrapper.err({
        code: 404,
        message: `Advert type<${id}> not found`,
      })
    }

    return ResultWrapper.ok({
      type: advertTypeMigrate(type),
    })
  }

  @LogAndHandle()
  async getTypeBySlug(slug: string): Promise<ResultWrapper<GetAdvertType>> {
    const type = await this.advertTypeModel.findOne({
      where: {
        slug,
      },
    })

    if (!type) {
      return ResultWrapper.err({
        code: 404,
        message: `Advert type<${slug}> not found`,
      })
    }

    return ResultWrapper.ok({
      type: advertTypeMigrate(type),
    })
  }

  @LogAndHandle()
  async getMainTypeById(id: string): Promise<ResultWrapper<GetAdvertMainType>> {
    const mainType = await this.advertMainTypeModel.findByPk(id)

    if (!mainType) {
      return ResultWrapper.err({
        code: 404,
        message: `Main advert type<${id}> not found`,
      })
    }

    return ResultWrapper.ok({
      mainType: advertMainTypeMigrate(mainType),
    })
  }

  @LogAndHandle()
  async getMainTypeBySlug(
    slug: string,
  ): Promise<ResultWrapper<GetAdvertMainType>> {
    const mainType = await this.advertMainTypeModel.findOne({
      where: {
        slug,
      },
    })

    if (!mainType) {
      return ResultWrapper.err({
        code: 404,
        message: `Main advert type<${slug}> not found`,
      })
    }

    return ResultWrapper.ok({
      mainType: advertMainTypeMigrate(mainType),
    })
  }

  @LogAndHandle()
  async createMainType(
    body: CreateMainAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertMainType>> {
    const id = uuid()
    const slug = slugify(body.title, { lower: true })

    const createBody = {
      id: id,
      title: body.title,
      slug: slug,
      departmentId: body.departmentId,
    }

    const mainType = await this.advertMainTypeModel.create(createBody)

    const mapped = await this.getMainTypeById(mainType.id)

    if (!mapped.result.ok) {
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create main advert type',
      })
    }

    await this.advertTypeModel.create({
      id: uuid(),
      title: mainType.title,
      slug: mainType.slug,
      mainTypeId: mainType.id,
    })

    return ResultWrapper.ok({
      mainType: mapped.result.value.mainType,
    })
  }

  @LogAndHandle()
  async createType(
    body: CreateAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertType>> {
    const id = uuid()
    const slug = slugify(body.title, { lower: true })

    const createBody = {
      id: id,
      title: body.title,
      slug: slug,
      mainTypeId: body.mainTypeId,
    }

    const type = await this.advertTypeModel.create(createBody)

    const mapped = await this.getTypeById(type.id)

    if (!mapped.result.ok) {
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create advert type',
      })
    }

    return ResultWrapper.ok({
      type: mapped.result.value.type,
    })
  }

  @LogAndHandle()
  async updateMainType(
    id: string,
    body: UpdateMainAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertMainType>> {
    const mainType = await this.advertMainTypeModel.findByPk(id, {
      include: [
        {
          model: AdvertTypeModelNew,
        },
      ],
    })

    if (!mainType) {
      return ResultWrapper.err({
        code: 404,
        message: `Main advert type<${id}> not found`,
      })
    }

    const updateBody = {
      title: body.title,
      slug: slugify(body.title, { lower: true }),
    }

    const updated = await mainType.update(updateBody, {
      returning: true,
    })

    return ResultWrapper.ok({
      mainType: advertMainTypeMigrate(updated),
    })
  }

  @LogAndHandle()
  async updateType(
    id: string,
    body: UpdateAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertType>> {
    const type = await this.advertTypeModel.findByPk(id)

    if (!type) {
      return ResultWrapper.err({
        code: 404,
        message: `Advert type<${id}> not found`,
      })
    }

    const updateBody = {
      title: body.title,
      slug: slugify(body.title, { lower: true }),
    }

    const updated = await type.update(updateBody, {
      returning: true,
    })

    return ResultWrapper.ok({
      type: advertTypeMigrate(updated),
    })
  }

  @LogAndHandle()
  async deleteMainType(id: string): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()
    try {
      const mainType = await this.advertMainTypeModel.findByPk(id)

      if (!mainType) {
        return ResultWrapper.err({
          code: 404,
          message: `Main advert type<${id}> not found`,
        })
      }

      const subTypes = await this.advertTypeModel.findAll({
        where: {
          mainTypeId: id,
        },
      })

      await Promise.all(
        subTypes.map((type) => type.destroy({ transaction: transaction })),
      )
      await mainType.destroy({ transaction: transaction })
      await transaction.commit()

      return ResultWrapper.ok()
    } catch (error) {
      await transaction.rollback()
      this.logger.error(`Failed to delete main advert type<${id}>`, {
        error: error,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to delete main advert type',
      })
    }
  }

  @LogAndHandle()
  async deleteType(id: string): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()
    try {
      const type = await this.advertTypeModel.findByPk(id)

      if (!type) {
        return ResultWrapper.err({
          code: 404,
          message: `Advert type<${id}> not found`,
        })
      }

      await type.destroy({ transaction: transaction })
      await transaction.commit()

      return ResultWrapper.ok()
    } catch (error) {
      await transaction.rollback()
      this.logger.error(`Failed to delete advert type<${id}>`, {
        error: error,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to delete advert type',
      })
    }
  }
}
