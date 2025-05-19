import slugify from 'slugify'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  baseEntityDetailedMigrate,
  baseEntityMigrate,
} from '@dmr.is/legal-gazette/dto'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CreateCaseTypeDto,
  GetCaseTypeDto,
  GetCaseTypesDetailedDto,
  GetCaseTypesDto,
  UpdateCaseTypeDto,
} from './dto/case-type.dto'
import { CaseTypeModel } from './case-type.model'
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
      types: caseTypes.map((caseType) => baseEntityMigrate(caseType)),
    }
  }

  async getCaseTypesDetailed(): Promise<GetCaseTypesDetailedDto> {
    const caseTypes = await this.caseTypeModel.scope('detailed').findAll()

    return {
      types: caseTypes.map((caseType) => baseEntityDetailedMigrate(caseType)),
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
        type: baseEntityMigrate(found),
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

    const theType = updatedType[1][0]

    return {
      type: baseEntityMigrate(theType),
    }
  }
  async deleteCaseType(id: string): Promise<GetCaseTypeDto> {
    const found = await this.caseTypeModel.findByPk(id)

    if (!found) {
      throw new NotFoundException('Case type not found')
    }

    await this.caseTypeModel.destroy({ where: { id } })

    return {
      type: baseEntityMigrate(found),
    }
  }
}
