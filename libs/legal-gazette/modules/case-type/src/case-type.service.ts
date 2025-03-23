import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ICaseTypeService } from './case-type.service.interface'
import {
  CreateCaseTypeDto,
  GetCaseTypeDto,
  GetCaseTypesDetailedDto,
  GetCaseTypesDto,
  UpdateCaseTypeDto,
} from './dto/case-type.dto'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Transactional } from '@dmr.is/decorators'
import { Sequelize } from 'sequelize-typescript'
import { Transaction } from 'sequelize'
import { InjectModel } from '@nestjs/sequelize'
import { CaseTypeModel } from './models/case-type.model'
import slugify from 'slugify'

const LOGGING_CONTEXT = 'CaseTypeService'

@Injectable()
export class CaseTypeService implements ICaseTypeService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseTypeModel) private caseTypeModel: typeof CaseTypeModel,
    private sequelize: Sequelize,
  ) {
    this.logger.info('CaseTypeService instantiated', {
      context: LOGGING_CONTEXT,
    })
  }

  async createCaseType(
    body: CreateCaseTypeDto,
    transaction?: Transaction,
  ): Promise<GetCaseTypeDto> {
    const newType = await this.caseTypeModel.create(
      {
        title: body.title,
        slug: slugify(body.title, { lower: true }),
      },
      { transaction, returning: true },
    )

    return {
      type: {
        id: newType.id,
        title: newType.title,
        slug: newType.slug,
      },
    }
  }

  @Transactional()
  async getCaseTypes(transaction?: Transaction): Promise<GetCaseTypesDto> {
    const caseTypes = await this.caseTypeModel.findAll({ transaction })

    return {
      types: caseTypes.map((caseType) => ({
        id: caseType.id,
        title: caseType.title,
        slug: caseType.slug,
      })),
    }
  }

  @Transactional()
  async getCaseTypesDetailed(
    transaction?: Transaction,
  ): Promise<GetCaseTypesDetailedDto> {
    const caseTypes = await this.caseTypeModel
      .scope('full')
      .findAll({ transaction })

    return {
      types: caseTypes.map((caseType) => ({
        id: caseType.id,
        title: caseType.title,
        slug: caseType.slug,
        createdAt: caseType.createdAt.toISOString(),
        updatedAt: caseType.updatedAt.toISOString(),
        deletedAt: caseType?.deletedAt
          ? caseType.deletedAt.toISOString()
          : null,
      })),
    }
  }

  @Transactional()
  async updateCaseType(
    id: string,
    body: UpdateCaseTypeDto,
    transaction?: Transaction,
  ): Promise<GetCaseTypeDto> {
    const found = await this.caseTypeModel.findByPk(id, { transaction })

    if (!found) {
      throw new NotFoundException('Case type not found')
    }

    if (!body.title) {
      return {
        type: {
          id: found.id,
          title: found.title,
          slug: found.slug,
        },
      }
    }

    const updatedType = await this.caseTypeModel.update(
      {
        title: body.title,
        slug: slugify(body?.title, { lower: true }),
      },
      {
        where: { id },
        returning: true,
        transaction,
      },
    )

    return {
      type: {
        id: updatedType[1][0].id,
        title: updatedType[1][0].title,
        slug: updatedType[1][0].slug,
      },
    }
  }
  async deleteCaseType(id: string, transaction?: Transaction): Promise<void> {
    await this.caseTypeModel.destroy({ where: { id }, transaction })
  }
}
