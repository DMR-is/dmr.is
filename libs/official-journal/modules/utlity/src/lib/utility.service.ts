import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertModel,
  AdvertStatusModel,
  AdvertTypeModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IUtilityService } from './utility.service.interface'

export class UtilityService implements IUtilityService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private advertModel: typeof AdvertModel,
    @InjectModel(CaseModel) private caseModel: typeof CaseModel,
    @InjectModel(AdvertDepartmentModel)
    private departmentModel: typeof AdvertDepartmentModel,
    @InjectModel(AdvertTypeModel)
    private typeModel: typeof AdvertTypeModel,
    @InjectModel(AdvertCategoryModel)
    private categoryModel: typeof AdvertCategoryModel,

    @InjectModel(CaseStatusModel)
    private caseStatusModel: typeof CaseStatusModel,

    @InjectModel(CaseTagModel) private caseTagModel: typeof CaseTagModel,
    @InjectModel(CaseCommunicationStatusModel)
    private caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,

    @InjectModel(AdvertStatusModel)
    private advertStatusModel: typeof AdvertStatusModel,
    private sequelize: Sequelize,
  ) {
    this.logger.info('Using UtilityService')
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  async getNextPublicationNumber(
    departmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<number>> {
    const now = new Date()

    const year = now.getFullYear()
    const janFirst = new Date(year, 0, 1)

    const nextPublicationNumber = await this.advertModel.count({
      distinct: true,
      where: {
        departmentId: {
          [Op.eq]: departmentId,
        },
        publicationDate: {
          [Op.gte]: janFirst,
        },
      },
      transaction,
    })

    return ResultWrapper.ok(nextPublicationNumber + 1)
  }

  @LogAndHandle()
  @Transactional()
  async categoryLookup(
    categoryId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertCategoryModel>> {
    const categoryLookup = await this.categoryModel.findByPk(categoryId, {
      transaction,
    })

    if (!categoryLookup) {
      throw new NotFoundException(`Category<${categoryId}> not found`)
    }

    return ResultWrapper.ok(categoryLookup)
  }

  @LogAndHandle()
  @Transactional()
  async advertStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertStatusModel>> {
    const statusLookup = await this.advertStatusModel.findOne({
      where: {
        title: status,
      },
      transaction,
    })

    if (!statusLookup) {
      throw new NotFoundException(`Status<${status}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async typeLookup(
    type: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertTypeModel>> {
    const typeLookup = await this.typeModel.findByPk(type, {
      include: [AdvertDepartmentModel],
      transaction,
    })

    if (!typeLookup) {
      throw new NotFoundException(`Type<${type}> not found`)
    }

    return ResultWrapper.ok(typeLookup)
  }

  @LogAndHandle()
  @Transactional()
  async getNextCaseNumber(
    departmentId: string,
    publicationYear: number,
    transaction?: Transaction,
  ): Promise<ResultWrapper<number>> {
    const serialNumber: number | null = await this.advertModel.max(
      'serialNumber',
      {
        where: {
          departmentId,
          publicationYear,
        },
        transaction,
      },
    )

    return ResultWrapper.ok(serialNumber ? serialNumber + 1 : 1)
  }

  @LogAndHandle()
  @Transactional()
  async departmentLookup(
    departmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<AdvertDepartmentModel>> {
    const departmentLookup = await this.departmentModel.findByPk(departmentId, {
      transaction,
    })

    if (!departmentLookup) {
      throw new NotFoundException(`Department<${departmentId}> not found`)
    }

    return ResultWrapper.ok(departmentLookup)
  }

  @LogAndHandle()
  @Transactional()
  async caseCommunicationStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommunicationStatusModel>> {
    const statusLookup = await this.caseCommunicationStatusModel.findOne({
      where: {
        title: status,
      },
      transaction,
    })

    if (!statusLookup) {
      throw new NotFoundException(`CommunicationStatus<${status}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async caseCommunicationStatusLookupById(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseCommunicationStatusModel>> {
    const statusLookup = await this.caseCommunicationStatusModel.findByPk(id, {
      transaction,
    })

    if (!statusLookup) {
      throw new NotFoundException(`CommunicationStatus<${id}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async caseTagLookup(
    tag: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseTagModel>> {
    const tagLookup = await this.caseTagModel.findOne({
      where: {
        title: tag,
      },
      transaction,
    })

    if (!tagLookup) {
      throw new NotFoundException(`Tag<${tag}> not found`)
    }

    return ResultWrapper.ok(tagLookup)
  }
  @LogAndHandle()
  @Transactional()
  async caseStatusLookup(
    status: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseStatusModel>> {
    const statusLookup = await this.caseStatusModel.findOne({
      where: {
        title: status,
      },
      transaction,
    })

    if (!statusLookup) {
      return ResultWrapper.err({
        code: 404,
        message: `Status<${status}> not found`,
      })
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  @Transactional()
  async generateInternalCaseNumber(
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ internalCaseNumber: string }>> {
    const now = new Date().toISOString()
    const [year, month, date] = now.split('T')[0].split('-')

    const caseCount = await this.caseModel.count({
      where: {
        createdAt: {
          [Op.between]: [`${year}-${month}-${date} 00:00:00`, now],
        },
      },
      transaction,
    })

    const count = caseCount + 1

    const withLeadingZeros =
      count < 10 ? `00${count}` : count < 100 ? `0${count}` : count

    const caseNumber = `${year}${month}${date}${withLeadingZeros}`

    return ResultWrapper.ok({ internalCaseNumber: caseNumber })
  }
}
