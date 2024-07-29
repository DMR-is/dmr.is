import { Op, Transaction } from 'sequelize'
import { Filenames } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import { CaseStatus, CaseWithAdvert, User } from '@dmr.is/shared/dto'
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
  advertCategoryMigrate,
  advertDepartmentMigrate,
  advertTypesMigrate,
} from '../helpers'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
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

  @LogAndHandle({ logArgs: false })
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
  async categoryLookup(
    categoryId: string,
  ): Promise<ResultWrapper<AdvertCategoryDTO>> {
    const categoryLookup = await this.categoryModel.findByPk(categoryId)

    if (!categoryLookup) {
      throw new NotFoundException(`Category<${categoryId}> not found`)
    }

    return ResultWrapper.ok(categoryLookup)
  }

  @LogAndHandle()
  async advertStatusLookup(
    status: string,
  ): Promise<ResultWrapper<AdvertStatusDTO, GenericError>> {
    const statusLookup = await this.advertStatusModel.findOne({
      where: {
        title: status,
      },
    })

    if (!statusLookup) {
      throw new NotFoundException(`Status<${status}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  async typeLookup(type: string): Promise<ResultWrapper<AdvertTypeDTO>> {
    const typeLookup = await this.typeDto.findByPk(type, {
      include: [AdvertDepartmentDTO],
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
  async getNextCaseNumber(
    departmentId: string,
    publicationYear: number,
  ): Promise<ResultWrapper<number>> {
    const serialNumber: number | null = await this.advertModel.max(
      'serialNumber',
      {
        where: {
          departmentId,
          publicationYear,
        },
      },
    )

    return ResultWrapper.ok(serialNumber ? serialNumber + 1 : 1)
  }

  @LogAndHandle()
  async departmentLookup(
    departmentId: string,
  ): Promise<ResultWrapper<AdvertDepartmentDTO>> {
    const departmentLookup = await this.departmentModel.findByPk(departmentId)

    if (!departmentLookup) {
      throw new NotFoundException(`Department<${departmentId}> not found`)
    }

    return ResultWrapper.ok(departmentLookup)
  }

  @LogAndHandle()
  async caseCommunicationStatusLookup(
    status: string,
  ): Promise<ResultWrapper<CaseCommunicationStatusDto>> {
    const statusLookup = await this.caseCommunicationStatusModel.findOne({
      where: {
        value: status,
      },
    })

    if (!statusLookup) {
      throw new NotFoundException(`CommunicationStatus<${status}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  async caseTagLookup(tag: string): Promise<ResultWrapper<CaseTagDto>> {
    const tagLookup = await this.caseTagModel.findOne({
      where: {
        value: tag,
      },
    })

    if (!tagLookup) {
      throw new NotFoundException(`Tag<${tag}> not found`)
    }

    return ResultWrapper.ok(tagLookup)
  }

  @LogAndHandle()
  async caseStatusLookup(
    status: string,
  ): Promise<ResultWrapper<CaseStatusDto>> {
    const statusLookup = await this.caseStatusModel.findOne({
      where: {
        value: status,
      },
    })

    if (!statusLookup) {
      throw new NotFoundException(`Status<${status}> not found`)
    }

    return ResultWrapper.ok(statusLookup)
  }

  @LogAndHandle()
  async generateCaseNumber(): Promise<ResultWrapper<string>> {
    const now = new Date().toISOString()
    const [year, month, date] = now.split('T')[0].split('-')

    const caseCount = await this.caseModel.count({
      where: {
        createdAt: {
          [Op.between]: [`${year}-${month}-${date} 00:00:00`, now],
        },
      },
    })

    const count = caseCount + 1

    const withLeadingZeros =
      count < 10 ? `00${count}` : count < 100 ? `0${count}` : count

    const caseNumber = `${year}${month}${date}${withLeadingZeros}`

    return ResultWrapper.ok(caseNumber)
  }

  @LogAndHandle()
  async caseLookupByApplicationId(
    applicationId: string,
  ): Promise<ResultWrapper<CaseDto>> {
    const found = await this.caseModel.findOne({
      where: {
        applicationId: applicationId,
      },
      include: CASE_RELATIONS,
    })

    if (!found) {
      throw new NotFoundException(
        `Case with applicationId<${applicationId}> not found`,
      )
    }

    return ResultWrapper.ok(found)
  }

  @LogAndHandle()
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

  @LogAndHandle()
  async getCaseWithAdvert(
    caseId: string,
  ): Promise<ResultWrapper<CaseWithAdvert>> {
    const caseLookup = (await this.caseLookup(caseId)).unwrap()

    const activeCase = caseMigrate(caseLookup)

    const applicationLookup = (
      await this.applicationService.getApplication(activeCase.applicationId)
    ).unwrap()

    const { application } = applicationLookup

    const department = (
      await this.departmentLookup(application.answers.advert.department)
    ).unwrap()

    const type = (
      await this.typeLookup(application.answers.advert.type)
    ).unwrap()

    const categoryIds =
      application.answers.publishing.contentCategories?.map((c) => c.value) ??
      []

    const categories = await this.categoryModel.findAll({
      where: {
        id: {
          [Op.in]: categoryIds,
        },
      },
    })

    // await this.involvedPartyModel.findByPk(application.applicant), // TODO: Users not implemented yet
    // TODO: Implement this when users are implemented
    // if (!involvedParty) {
    //   throw new NotFoundException(
    //     `Involved party with id ${application.applicant} not found`,
    //   )
    // }

    const involvedParty = await this.involvedPartyModel.findByPk(
      '195eccdc-baf3-4cec-97ac-ef1c5161b091',
    )

    if (!involvedParty) {
      return ResultWrapper.err({
        code: 404,
        message: `Could not find involved party <195eccdc-baf3-4cec-97ac-ef1c5161b091>`,
      })
    }

    const activeDepartment = advertDepartmentMigrate(department)
    const activeType = advertTypesMigrate(type)
    const activeCategories = categories.map((c) => advertCategoryMigrate(c))

    let signatureDate = null
    switch (application.answers.signature.type) {
      case 'regular': {
        const firstSignature = application.answers.signature.regular?.at(0)
        signatureDate = firstSignature?.date
        break
      }
      case 'committee':
        signatureDate = application.answers.signature.committee?.date
        break
    }

    if (!signatureDate) {
      return ResultWrapper.err({
        code: 404,
        message: `Could not find signature date`,
      })
    }

    const attachments: { name: string; url: string }[] = []

    application.answers.original.files.forEach((file) => {
      const url = application.attachments[file.key]

      attachments.push({
        name: file.name,
        url: url,
      })
    })

    const fileNamePrefix =
      application.answers.additionsAndDocuments.fileNames === 'document'
        ? Filenames.Documents
        : Filenames.Appendix

    application.answers.additionsAndDocuments.files.forEach((file, i) => {
      const url = application.attachments[file.key]

      const name = `${fileNamePrefix} ${i + 1}`

      attachments.push({
        name: name,
        url: url,
      })
    })

    return ResultWrapper.ok({
      activeCase: activeCase,
      advert: {
        title: application.answers.advert.title,
        documents: {
          advert: application.answers.advert.document,
          signature: application.answers.signature.signature,
          full: application.answers.preview.document,
        },
        publicationDate: application.answers.publishing.date,
        signatureDate: signatureDate,
        department: activeDepartment,
        type: activeType,
        categories: activeCategories,
        involvedParty: involvedParty,
        attachments: attachments,
      },
    })
  }
}
