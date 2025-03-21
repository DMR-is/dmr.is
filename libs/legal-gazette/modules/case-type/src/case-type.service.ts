import { Inject, Injectable } from '@nestjs/common'
import { ICaseTypeService } from './case-type.service.interface'
import { GetCaseTypesDetailedDto, GetCaseTypesDto } from './dto/case-type.dto'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Transactional } from '@dmr.is/decorators'
import { Sequelize } from 'sequelize-typescript'
import { Transaction } from 'sequelize'
import { InjectModel } from '@nestjs/sequelize'
import { CaseTypeModel } from './models/case-type.model'

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
  async getCaseTypesDetail(
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
}
