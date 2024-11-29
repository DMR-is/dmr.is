import {
  ForeignKeyConstraintError,
  Transaction,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import slugify from 'slugify'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle, LogMethod, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertTypeQuery,
  CreateAdvertMainTypeBody,
  CreateAdvertTypeBody,
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
  UpdateAdvertMainType,
  UpdateAdvertTypeBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IAdvertTypeService } from './advert-type.service.interface'
import { advertMainTypeMigrate, advertTypeMigrate } from './migrations'
import {
  AdvertDepartmentModel,
  AdvertMainTypeModel,
  AdvertTypeModel,
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
    @InjectModel(AdvertTypeModel)
    private readonly advertTypeModel: typeof AdvertTypeModel,
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
    const page = query?.page ? query.page : DEFAULT_PAGE_NUMBER
    const pageSize = query?.pageSize ? query.pageSize : DEFAULT_PAGE_SIZE
    const offset = (page - 1) * pageSize

    const whereParams = getAdvertTypeWhereParams(query)
    const departmentWhereParams = getAdvertTypeDepartmentWhereParams(
      query?.department,
    )

    const mainTypesLookup = await this.advertMainTypeModel.findAndCountAll({
      distinct: true,
      where: whereParams,
      order: [['title', 'DESC']],
      include: [
        {
          model: AdvertTypeModel,
        },
        {
          model: AdvertDepartmentModel,
          where: departmentWhereParams,
        },
      ],
      offset: offset,
      limit: pageSize,
    })

    const mapped = mainTypesLookup.rows.map(advertMainTypeMigrate)
    const paging = generatePaging(mapped, page, pageSize, mainTypesLookup.count)

    return ResultWrapper.ok({
      mainTypes: mapped,
      paging,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getTypeById(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertType>> {
    const type = await this.advertTypeModel.findByPk(id, {
      include: [
        { model: AdvertMainTypeModel, include: [AdvertDepartmentModel] },
      ],
      transaction,
    })

    if (!type) {
      this.logger.warn(`Advert type<${id}> not found`, {
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 404,
        message: `Tegund fannst ekki`,
      })
    }

    return ResultWrapper.ok({
      type: advertTypeMigrate(type),
    })
  }

  @LogAndHandle()
  async getMainTypeById(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertMainType>> {
    const mainType = await this.advertMainTypeModel.findByPk(id, {
      include: [AdvertTypeModel, AdvertDepartmentModel],
      transaction,
    })

    if (!mainType) {
      this.logger.warn(`Main advert type<${id}> not found`, {
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 404,
        message: `Yfirflokkur fannst ekki`,
      })
    }

    return ResultWrapper.ok({
      mainType: advertMainTypeMigrate(mainType),
    })
  }

  @LogAndHandle()
  @Transactional()
  async createMainType(
    body: CreateAdvertMainTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertMainType>> {
    try {
      const id = uuid()
      const department = await AdvertDepartmentModel.findByPk(body.departmentId)

      if (!department) {
        this.logger.warn(`Advert department not found`, {
          category: LOGGING_CATEGORY,
        })

        return ResultWrapper.err({
          code: 404,
          message: `Deild yfirflokks fannst ekki`,
        })
      }

      const slug = slugify(`${department.slug}-${body.title}`, { lower: true })

      const createBody = {
        id: id,
        title: body.title,
        slug: slug,
        departmentId: body.departmentId,
      }

      await this.advertMainTypeModel.create(createBody, {
        transaction: transaction,
      })

      const mapped = await this.getMainTypeById(id, transaction)

      if (!mapped.result.ok) {
        return ResultWrapper.err({
          code: 500,
          message: 'Ekki tóskt að búa til yfirflokk',
        })
      }

      await this.createType(
        {
          title: body.title,
          mainTypeId: id,
        },
        transaction,
      )

      return ResultWrapper.ok({
        mainType: mapped.result.value.mainType,
      })
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        this.logger.warn(`Main advert type already exists`, {
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 400,
          message: 'Yfirflokkur með þessu heiti er þegar til',
        })
      }

      this.logger.error(`Failed to create main advert type`, {
        error: error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Ekki tókst að búa til yfirflokk',
      })
    }
  }

  @LogAndHandle()
  @Transactional()
  async createType(
    body: CreateAdvertTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertType>> {
    try {
      const id = uuid()
      const mainType = await this.getMainTypeById(body.mainTypeId, transaction)

      if (!mainType.result.ok) {
        return ResultWrapper.err({
          code: 404,
          message: `Yfirflokkur tegundar fannst ekki`,
        })
      }

      let slug = ''
      if (mainType.result.value.mainType.types.length > 0) {
        slug = slugify(`${mainType.result.value.mainType.slug}-${body.title}`, {
          lower: true,
        })
      } else {
        slug = mainType.result.value.mainType.slug
      }

      const createBody = {
        id: id,
        title: body.title,
        slug: slug,
        mainTypeId: body.mainTypeId,
      }

      const type = await this.advertTypeModel.create(createBody, {
        transaction: transaction,
      })

      const mapped = await this.getTypeById(type.id, transaction)

      if (!mapped.result.ok) {
        return ResultWrapper.err({
          code: 500,
          message: 'Ekki tókst að búa til tegund',
        })
      }

      return ResultWrapper.ok({
        type: mapped.result.value.type,
      })
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        this.logger.warn(`Advert type already exists`, {
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 400,
          message: 'Tegund með þessu heiti er þegar til',
        })
      }

      this.logger.error(`Failed to create advert type`, {
        error: error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Ekki tókst að búa til tegund',
      })
    }
  }

  @LogMethod()
  @Transactional()
  async updateMainType(
    id: string,
    body: UpdateAdvertMainType,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertMainType>> {
    try {
      const mainType = await this.advertMainTypeModel.findByPk(id, {
        include: [
          {
            model: AdvertTypeModel,
          },
          { model: AdvertDepartmentModel },
        ],
        transaction,
      })

      if (!mainType) {
        this.logger.warn(`Main advert type not found`, {
          id: id,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 404,
          message: `Yfirflokkur fannst ekki`,
        })
      }

      const oldSlug = mainType.slug
      const slug = slugify(`${mainType.department.slug}-${body.title}`, {
        lower: true,
      })
      const updateMainTypeBody = {
        title: body.title,
        slug: slug,
      }

      await mainType.update(updateMainTypeBody, {
        transaction,
      })

      if (mainType.types) {
        const typesToUpdate = mainType.types.filter(
          (type) => type.slug !== oldSlug,
        )
        const typeWithSameSlug = mainType.types.find(
          (type) => type.slug === oldSlug,
        )

        // this should always run
        if (typeWithSameSlug) {
          await typeWithSameSlug.update(
            {
              slug: slug,
            },
            {
              transaction,
            },
          )
        }

        const updatedTypePromises = typesToUpdate.map(async (type) => {
          const subTypeSlug = slugify(`${slug}-${type.title}`, { lower: true })
          return this.advertTypeModel.update(
            {
              slug: subTypeSlug,
            },
            {
              where: {
                id: type.id,
              },
              transaction,
            },
          )
        })

        await Promise.all(updatedTypePromises)
      }

      const mapped = await this.getMainTypeById(id, transaction)

      if (!mapped.result.ok) {
        return ResultWrapper.err({
          code: 500,
          message: 'Ekki tókst að uppfæra yfirflokk',
        })
      }

      return ResultWrapper.ok({ mainType: mapped.result.value.mainType })
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResultWrapper.err({
          code: 400,
          message: 'Yfirflokkur með þessu heiti er þegar til',
        })
      }

      this.logger.error(`Failed to update main advert type`, {
        id: id,
        error: error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Ekki tókst að uppfæra yfirflokk',
      })
    }
  }

  @LogAndHandle()
  async updateType(
    id: string,
    body: UpdateAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertType>> {
    try {
      const type = await this.advertTypeModel.findByPk(id)

      if (!type) {
        this.logger.warn(`Advert type<${id}> not found`, {
          id: id,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 404,
          message: `Tegund fannst ekki`,
        })
      }

      // we need to check if the main type has the same slug if so then we cant update the slug
      const mainType = await this.advertMainTypeModel.findByPk(type.mainTypeId)

      if (!mainType) {
        this.logger.warn(`Main advert type<${type.mainTypeId}> not found`, {
          id: type.mainTypeId,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 404,
          message: `Yfirflokkur fannst ekki`,
        })
      }

      if (mainType.slug === type.slug) {
        this.logger.warn(
          `Main advert type<${type.mainTypeId}> has the same slug as the type<${id}>`,
          {
            id: type.mainTypeId,
            category: LOGGING_CATEGORY,
          },
        )

        return ResultWrapper.err({
          code: 400,
          message: `Ekki er hægt að uppfæra þessa tegund`,
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
    } catch (error) {
      if (error instanceof ValidationError) {
        this.logger.warn(`Advert type<${id}> already exists`, {
          id: id,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 400,
          message: 'Tegund með þessu heiti er þegar til',
        })
      }

      this.logger.error(`Failed to update advert type<${id}>`, {
        error: error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Ekki tókst að uppfæra tegund',
      })
    }
  }

  @LogAndHandle()
  async deleteMainType(id: string): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()
    try {
      const mainType = await this.advertMainTypeModel.findByPk(id)

      if (!mainType) {
        this.logger.warn(`Main advert type<${id}> not found`, {
          id: id,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 404,
          message: `Yfirflokkur fannst ekki`,
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

      if (error instanceof ForeignKeyConstraintError) {
        this.logger.warn(`Main advert type<${id}> is in use`, {
          id: id,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 400,
          message: 'Yfirflokkur er í notkun',
        })
      }

      this.logger.error(`Failed to delete main advert type<${id}>`, {
        error: error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Ekki tókst að eyða yfirflokk',
      })
    }
  }

  @LogAndHandle()
  async deleteType(id: string): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()
    try {
      const type = await this.advertTypeModel.findByPk(id)

      if (!type) {
        this.logger.warn(`Advert type<${id}> not found`, {
          id: id,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 404,
          message: `Tegund fannst ekki`,
        })
      }

      const mainType = await this.advertMainTypeModel.findByPk(type.mainTypeId)
      if (!mainType) {
        this.logger.warn(`Main advert type<${type.mainTypeId}> not found`, {
          id: type.mainTypeId,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 404,
          message: `Yfirflokkur fannst ekki`,
        })
      }

      if (mainType.slug === type.slug) {
        this.logger.warn(
          `Main advert type<${type.mainTypeId}> has the same slug as the type<${id}>`,
          {
            id: type.mainTypeId,
            category: LOGGING_CATEGORY,
          },
        )

        return ResultWrapper.err({
          code: 400,
          message: `Ekki er hægt að eyða þessari tegund`,
        })
      }
      await type.destroy({ transaction: transaction })
      await transaction.commit()

      return ResultWrapper.ok()
    } catch (error) {
      await transaction.rollback()

      if (error instanceof ForeignKeyConstraintError) {
        this.logger.warn(`Advert type<${id}> is in use`, {
          id: id,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 400,
          message: 'Tegund er í notkun',
        })
      }

      this.logger.error(`Failed to delete advert type<${id}>`, {
        error: error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Ekki tókst að eyða tegund',
      })
    }
  }
}
