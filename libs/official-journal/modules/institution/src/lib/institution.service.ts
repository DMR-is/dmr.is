import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import slugify from 'slugify'
import { v4 as uuid } from 'uuid'
import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IInstitutionService } from './institution.service.interface'
import { AdvertInvolvedPartyModel } from '@dmr.is/official-journal/models'
import { InstitutionQuery } from './dto/get-institutions-query.dto'
import { GetInstitutions } from './dto/get-institutions-response.dto'
import { GetInstitution } from './dto/get-institution-response.dto'
import {
  CreateInstitution,
  UpdateInstitution,
} from '@dmr.is/official-journal/dto/institution/institution.dto'
import { institutionMigrate } from '@dmr.is/official-journal/migrations/institution/institution.migrate'

const LOGGING_CATEGORY = 'institution-service'

@Injectable()
export class InstitutionService implements IInstitutionService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertInvolvedPartyModel)
    private readonly institutionModel: typeof AdvertInvolvedPartyModel,
    private readonly sequelize: Sequelize,
  ) {}

  @LogMethod()
  async getInstitutions(
    query: InstitutionQuery,
  ): Promise<ResultWrapper<GetInstitutions>> {
    const whereParams = {}

    if (query.search) {
      Object.assign(whereParams, {
        title: {
          [Op.iLike]: `%${query.search}%`,
        },
      })
    }

    const institutions = await this.institutionModel.findAndCountAll({
      offset: (query.page - 1) * query.pageSize,
      limit: query.pageSize,
      where: whereParams,
      order: [['title', 'ASC']],
    })

    const mapped = institutions.rows.map((institution) =>
      institutionMigrate(institution),
    )
    const paging = generatePaging(
      mapped,
      query.page,
      query.pageSize,
      institutions.count,
    )

    return ResultWrapper.ok({ institutions: mapped, paging })
  }
  @LogMethod()
  async getInstitution(id: string): Promise<ResultWrapper<GetInstitution>> {
    const institution = await this.institutionModel.findByPk(id)

    if (!institution) {
      return ResultWrapper.err({
        code: 404,
        message: 'Institution not found',
      })
    }

    return ResultWrapper.ok({ institution: institutionMigrate(institution) })
  }

  @LogMethod()
  async createInstitution(
    body: CreateInstitution,
  ): Promise<ResultWrapper<GetInstitution>> {
    const transcation = await this.sequelize.transaction()
    try {
      const id = uuid()
      const slug = slugify(body.title, { lower: true })

      const createdInstitution = await this.institutionModel.create(
        {
          id,
          title: body.title,
          nationalId: body.nationalId,
          slug,
        },
        { transaction: transcation },
      )

      await transcation.commit()

      return ResultWrapper.ok({
        institution: institutionMigrate(createdInstitution),
      })
    } catch (error) {
      await transcation.rollback()
      this.logger.error(`Error creating institution`, {
        category: LOGGING_CATEGORY,
        method: 'createInstitution',
        error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create institution',
      })
    }
  }

  @LogMethod()
  async updateInstitution(
    id: string,
    body: UpdateInstitution,
  ): Promise<ResultWrapper<GetInstitution>> {
    const transcation = await this.sequelize.transaction()
    try {
      const institution = await this.institutionModel.findByPk(id, {
        transaction: transcation,
      })

      if (!institution) {
        return ResultWrapper.err({
          code: 404,
          message: 'Institution not found',
        })
      }

      if (!body.title) {
        return ResultWrapper.ok({
          institution: institutionMigrate(institution),
        })
      }

      const slug = slugify(body.title, { lower: true })
      await institution.update(
        {
          title: body.title,
          slug,
        },
        { transaction: transcation },
      )

      await transcation.commit()

      return ResultWrapper.ok({
        institution: institutionMigrate(institution),
      })
    } catch (error) {
      await transcation.rollback()
      this.logger.error(`Error updating institution`, {
        category: LOGGING_CATEGORY,
        method: 'updateInstitution',
        error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to update institution',
      })
    }
  }

  @LogMethod()
  async deleteInstitution(id: string): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()

    try {
      const institution = await this.institutionModel.findByPk(id, {
        transaction,
      })

      if (!institution) {
        return ResultWrapper.err({
          code: 404,
          message: 'Institution not found',
        })
      }

      await institution.destroy({ transaction })

      await transaction.commit()

      return ResultWrapper.ok()
    } catch (error) {
      await transaction.rollback()
      this.logger.error(`Error deleting institution`, {
        category: LOGGING_CATEGORY,
        method: 'deleteInstitution',
        error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to delete institution',
      })
    }
  }
}
