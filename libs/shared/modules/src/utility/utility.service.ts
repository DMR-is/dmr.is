import { Op, Transaction } from 'sequelize'
import { Filenames } from '@dmr.is/constants'
import { Audit, HandleException } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import { CaseWithAdvert, User } from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

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
  AdvertTypeDTO,
} from '../journal/models'
import { IUtilityService } from './utility.service.interface'

const LOGGING_CATEGORY = 'UtilityService'

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
  ) {
    this.logger.info('Using UtilityService')
  }

  @Audit()
  @HandleException()
  async categoryLookup(categoryId: string): Promise<Result<AdvertCategoryDTO>> {
    const categoryLookup = await this.categoryModel.findByPk(categoryId)

    if (!categoryLookup) {
      throw new NotFoundException(`Category<${categoryId}> not found`)
    }

    return {
      ok: true,
      value: categoryLookup,
    }
  }

  @Audit()
  @HandleException()
  async typeLookup(type: string): Promise<Result<AdvertTypeDTO>> {
    const typeLookup = await this.typeDto.findByPk(type, {
      include: [AdvertDepartmentDTO],
    })

    if (!typeLookup) {
      throw new NotFoundException(`Type<${type}> not found`)
    }

    return {
      ok: true,
      value: typeLookup,
    }
  }

  @Audit()
  @HandleException()
  userLookup(userId: string): Promise<Result<User>> {
    const userLookup = ALL_MOCK_USERS.find((u) => u.id === userId)

    if (!userLookup) {
      throw new NotFoundException(`User<${userId}> not found`)
    }

    return Promise.resolve({
      ok: true,
      value: userLookup,
    })
  }

  @Audit()
  @HandleException()
  async getNextSerialNumber(
    departmentId: string,
    publicationYear: number,
  ): Promise<Result<number>> {
    const serialNumber: number | null = await this.advertModel.max(
      'serialNumber',
      {
        where: {
          departmentId,
          publicationYear,
        },
      },
    )

    return {
      ok: true,
      value: serialNumber ? serialNumber + 1 : 1,
    }
  }

  @Audit()
  @HandleException()
  async departmentLookup(
    departmentId: string,
  ): Promise<Result<AdvertDepartmentDTO>> {
    const departmentLookup = await this.departmentModel.findByPk(departmentId)

    if (!departmentLookup) {
      throw new NotFoundException(`Department<${departmentId}> not found`)
    }

    return {
      ok: true,
      value: departmentLookup,
    }
  }

  @Audit()
  @HandleException()
  async caseCommunicationStatusLookup(
    status: string,
  ): Promise<Result<CaseCommunicationStatusDto>> {
    const statusLookup = await this.caseCommunicationStatusModel.findOne({
      where: {
        value: status,
      },
    })

    if (!statusLookup) {
      throw new NotFoundException(`CommunicationStatus<${status}> not found`)
    }

    return {
      ok: true,
      value: statusLookup,
    }
  }

  @Audit()
  @HandleException()
  async caseTagLookup(tag: string): Promise<Result<CaseTagDto>> {
    const tagLookup = await this.caseTagModel.findOne({
      where: {
        value: tag,
      },
    })

    if (!tagLookup) {
      throw new NotFoundException(`Tag<${tag}> not found`)
    }

    return {
      ok: true,
      value: tagLookup,
    }
  }

  @Audit()
  @HandleException()
  async caseStatusLookup(status: string): Promise<Result<CaseStatusDto>> {
    const statusLookup = await this.caseStatusModel.findOne({
      where: {
        value: status,
      },
    })

    if (!statusLookup) {
      throw new NotFoundException(`Status<${status}> not found`)
    }

    return {
      ok: true,
      value: statusLookup,
    }
  }

  @Audit()
  @HandleException()
  async generateCaseNumber(): Promise<Result<string>> {
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

    return {
      ok: true,
      value: caseNumber,
    }
  }

  @Audit()
  @HandleException()
  async caseLookupByApplicationId(
    applicationId: string,
  ): Promise<Result<CaseDto>> {
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

    return {
      ok: true,
      value: found,
    }
  }

  @Audit()
  @HandleException()
  async caseLookup(
    caseId: string,
    transaction?: Transaction,
  ): Promise<Result<CaseDto>> {
    const found = await this.caseModel.findByPk(caseId, {
      include: CASE_RELATIONS,
      transaction,
    })

    if (!found) {
      throw new NotFoundException(`Case<${caseId}> not found`)
    }

    return {
      ok: true,
      value: found,
    }
  }

  @Audit()
  @HandleException()
  async getCaseWithAdvert(caseId: string): Promise<Result<CaseWithAdvert>> {
    const caseLookup = await this.caseLookup(caseId)
    if (!caseLookup.ok) {
      return caseLookup
    }

    const activeCase = caseMigrate(caseLookup.value)

    const applicationLookup = await this.applicationService.getApplication(
      activeCase.applicationId,
    )

    if (!applicationLookup.ok) {
      return applicationLookup
    }

    const { application } = applicationLookup.value

    const departmentLookup = await this.departmentLookup(
      application.answers.advert.department,
    )

    if (!departmentLookup.ok) {
      return departmentLookup
    }

    const type = await this.typeLookup(application.answers.advert.type)
    if (!type.ok) {
      return type
    }

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
      this.logger.warn(
        `getCaseWithAdvert, could not find involved party <195eccdc-baf3-4cec-97ac-ef1c5161b091>`,
        {
          caseId: caseId,
          applicationId: activeCase.applicationId,
          category: LOGGING_CATEGORY,
        },
      )
      return {
        ok: false,
        error: {
          code: 404,
          message: `Could not find involved party <195eccdc-baf3-4cec-97ac-ef1c5161b091>`,
        },
      }
    }

    const activeDepartment = advertDepartmentMigrate(departmentLookup.value)
    const activeType = advertTypesMigrate(type.value)
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
      this.logger.warn(`getCaseWithAdvert, could not find signature date`, {
        caseId: caseId,
        applicationId: activeCase.applicationId,
        category: LOGGING_CATEGORY,
      })
      return {
        ok: false,
        error: {
          code: 404,
          message: `Could not find signature date`,
        },
      }
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

    return {
      ok: true,
      value: {
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
      },
    }
  }
}
