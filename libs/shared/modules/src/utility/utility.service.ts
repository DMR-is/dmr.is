import { Op, Transaction } from 'sequelize'
import { ApplicationEvent } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import { GetApplicationResponse, User } from '@dmr.is/shared/dto'
import { GenericError, ResultWrapper } from '@dmr.is/types'

import { Inject, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
} from '../case/models'
import { CaseCategoriesDto } from '../case/models/CaseCategories'
import { CASE_RELATIONS } from '../case/relations'
import {
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertDTO,
  AdvertInvolvedPartyDTO,
  AdvertStatusDTO,
  AdvertTypeDTO,
} from '../journal/models'
import { IUtilityService } from './utility.service.interface'

export class UtilityService implements IUtilityService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IApplicationService)
    private applicationService: IApplicationService,
    @InjectModel(AdvertDTO) private advertModel: typeof AdvertDTO,
    @InjectModel(CaseDto) private caseModel: typeof CaseDto,
    @InjectModel(AdvertDepartmentDTO)
    private departmentModel: typeof AdvertDepartmentDTO,
    @InjectModel(AdvertTypeDTO) private typeDto: typeof AdvertTypeDTO,

    @InjectModel(AdvertInvolvedPartyDTO)
    private involvedPartyModel: typeof AdvertInvolvedPartyDTO,
    @InjectModel(AdvertCategoryDTO)
    private categoryModel: typeof AdvertCategoryDTO,

    @InjectModel(CaseStatusDto) private caseStatusModel: typeof CaseStatusDto,

    @InjectModel(CaseTagDto) private caseTagModel: typeof CaseTagDto,
    @InjectModel(CaseCommunicationStatusDto)
    private caseCommunicationStatusModel: typeof CaseCommunicationStatusDto,
    @InjectModel(CaseCategoriesDto)
    private caseCategoriesModel: typeof CaseCategoriesDto,
    @InjectModel(AdvertStatusDTO)
    private advertStatusModel: typeof AdvertStatusDTO,
  ) {
    this.logger.info('Using UtilityService')
  }

  @LogAndHandle()
  async approveApplication(applicationId: string): Promise<ResultWrapper> {
    ResultWrapper.unwrap(
      await this.applicationService.submitApplication(
        applicationId,
        ApplicationEvent.Approve,
      ),
    )
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async rejectApplication(
    applicationId: string,
  ): Promise<ResultWrapper<unknown, GenericError>> {
    ResultWrapper.unwrap(
      await this.applicationService.submitApplication(
        applicationId,
        ApplicationEvent.Reject,
      ),
    )
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async applicationLookup(
    applicationId: string,
  ): Promise<ResultWrapper<GetApplicationResponse>> {
    const application = (
      await this.applicationService.getApplication(applicationId)
    ).unwrap()

    return ResultWrapper.ok(application)
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
  ): Promise<ResultWrapper<AdvertCategoryDTO>> {
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
  ): Promise<ResultWrapper<AdvertStatusDTO>> {
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
  ): Promise<ResultWrapper<AdvertTypeDTO>> {
    const typeLookup = await this.typeDto.findByPk(type, {
      include: [AdvertDepartmentDTO],
      transaction,
    })

    if (!typeLookup) {
      throw new NotFoundException(`Type<${type}> not found`)
    }

    return ResultWrapper.ok(typeLookup)
  }

  @LogAndHandle()
  async userLookup(userId: string): Promise<ResultWrapper<User>> {
    const userLookup = ALL_MOCK_USERS.find((u) => u.id === userId)

    if (!userLookup) {
      throw new NotFoundException(`User<${userId}> not found`)
    }

    return ResultWrapper.ok(userLookup)
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
  ): Promise<ResultWrapper<AdvertDepartmentDTO>> {
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
  ): Promise<ResultWrapper<CaseCommunicationStatusDto>> {
    const statusLookup = await this.caseCommunicationStatusModel.findOne({
      where: {
        value: status,
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
  ): Promise<ResultWrapper<CaseCommunicationStatusDto>> {
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
  ): Promise<ResultWrapper<CaseTagDto>> {
    const tagLookup = await this.caseTagModel.findOne({
      where: {
        value: tag,
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
  ): Promise<ResultWrapper<CaseStatusDto>> {
    const statusLookup = await this.caseStatusModel.findOne({
      where: {
        value: status,
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
  async generateInternalCaseNumber(
    transaction?: Transaction,
  ): Promise<ResultWrapper<string>> {
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

    return ResultWrapper.ok(caseNumber)
  }

  @LogAndHandle()
  @Transactional()
  async caseLookupByApplicationId(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseDto>> {
    const found = await this.caseModel.findOne({
      where: {
        applicationId: applicationId,
      },
      include: CASE_RELATIONS,
      transaction,
    })

    if (!found) {
      throw new NotFoundException(
        `Case with applicationId<${applicationId}> not found`,
      )
    }

    return ResultWrapper.ok(found)
  }

  @LogAndHandle()
  @Transactional()
  async caseLookup(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseDto>> {
    const found = await this.caseModel.findByPk(caseId, {
      include: CASE_RELATIONS,
      transaction,
    })

    if (!found) {
      throw new NotFoundException(`Case<${caseId}> not found`)
    }

    return new ResultWrapper({
      ok: true,
      value: found,
    })
  }
}
