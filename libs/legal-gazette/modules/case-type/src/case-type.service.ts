import slugify from 'slugify'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CreateCaseTypeDto,
  GetCaseTypeDto,
  GetCaseTypesDetailedDto,
  GetCaseTypesDto,
  UpdateCaseTypeDto,
} from './dto/case-type.dto'
import { CaseTypeModel } from './models/case-type.model'
import { ICaseTypeService } from './case-type.service.interface'

const LOGGING_CONTEXT = 'CaseTypeService'

@Injectable()
export class CaseTypeService implements ICaseTypeService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseTypeModel) private caseTypeModel: typeof CaseTypeModel,
  ) {
    this.logger.info('CaseTypeService instantiated', {
      context: LOGGING_CONTEXT,
    })
  }

  async createCaseType(body: CreateCaseTypeDto): Promise<GetCaseTypeDto> {
    const newType = await this.caseTypeModel.create(
      {
        title: body.title,
        slug: slugify(body.title, { lower: true }),
      },
      { returning: true },
    )

    return {
      type: {
        id: newType.id,
        title: newType.title,
        slug: newType.slug,
      },
    }
  }

  async getCaseTypes(): Promise<GetCaseTypesDto> {
    const caseTypes = await this.caseTypeModel.findAll()

    return {
      types: caseTypes.map((caseType) => ({
        id: caseType.id,
        title: caseType.title,
        slug: caseType.slug,
      })),
    }
  }

  async getCaseTypesDetailed(): Promise<GetCaseTypesDetailedDto> {
    const caseTypes = await this.caseTypeModel.scope('full').findAll()

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

  async updateCaseType(
    id: string,
    body: UpdateCaseTypeDto,
  ): Promise<GetCaseTypeDto> {
    const found = await this.caseTypeModel.findByPk(id)

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
  async deleteCaseType(id: string): Promise<GetCaseTypeDto> {
    const found = await this.caseTypeModel.findByPk(id)

    if (!found) {
      throw new NotFoundException('Case type not found')
    }

    await this.caseTypeModel.destroy({ where: { id } })

    return {
      type: {
        id: found.id,
        title: found.title,
        slug: found.slug,
      },
    }
  }
}
