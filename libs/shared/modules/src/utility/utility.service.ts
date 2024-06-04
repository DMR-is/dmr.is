import { Op } from 'sequelize'
import { Filenames } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import { CaseWithAdvert, User } from '@dmr.is/shared/dto'

import { Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
} from '../case/models'
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
  AdvertInvolvedPartyDTO,
  AdvertTypeDTO,
} from '../journal/models'
import { handleException, handleNotFoundLookup } from '../lib/utils'
import { Result } from '../types/result'
import { IUtilityService } from './utility.service.interface'

const LOGGING_CATEGORY = 'UtilityService'

export class UtilityService implements IUtilityService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(IApplicationService)
    private applicationService: IApplicationService,
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
  ) {
    this.logger.info('Using UtilityService')
  }
  async typeLookup(type: string): Promise<Result<AdvertTypeDTO>> {
    this.logger.info('typeLookup', {
      category: LOGGING_CATEGORY,
      type: type,
    })

    try {
      const typeLookup = await this.typeDto.findByPk(type, {
        include: [AdvertDepartmentDTO],
      })

      if (!typeLookup) {
        return handleNotFoundLookup({
          method: 'typeLookup',
          entity: 'type',
          id: type,
          category: LOGGING_CATEGORY,
          info: {
            type,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: typeLookup,
      })
    } catch (error) {
      return handleException({
        method: 'typeLookup',
        category: LOGGING_CATEGORY,
        message: 'Could not get type',
        error,
        info: {
          type,
        },
      })
    }
  }
  userLookup(userId: string): Promise<Result<User>> {
    this.logger.info('userLookup', {
      category: LOGGING_CATEGORY,
      userId: userId,
    })

    try {
      const userLookup = ALL_MOCK_USERS.find((u) => u.id === userId)

      if (!userLookup) {
        return handleNotFoundLookup({
          method: 'userLookup',
          entity: 'user',
          id: userId,
          category: LOGGING_CATEGORY,
          info: {
            userId,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: userLookup,
      })
    } catch (error) {
      return handleException({
        method: 'userLookup',
        category: LOGGING_CATEGORY,
        message: 'Could not get user',
        error,
        info: {
          userId,
        },
      })
    }
  }
  async departmentLookup(
    departmentId: string,
  ): Promise<Result<AdvertDepartmentDTO>> {
    this.logger.info('advertDepartmentLookup', {
      category: LOGGING_CATEGORY,
      departmentId: departmentId,
    })

    try {
      const departmentLookup = await this.departmentModel.findByPk(departmentId)

      if (!departmentLookup) {
        return handleNotFoundLookup({
          method: 'advertDepartmentLookup',
          entity: 'department',
          id: departmentId,
          category: LOGGING_CATEGORY,
          info: {
            departmentId,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: departmentLookup,
      })
    } catch (error) {
      return handleException({
        method: 'advertDepartmentLookup',
        category: LOGGING_CATEGORY,
        message: 'Could not get department',
        error,
        info: {
          departmentId,
        },
      })
    }
  }
  async caseCommunicationStatusLookup(
    status: string,
  ): Promise<Result<CaseCommunicationStatusDto>> {
    this.logger.info('caseCommunicationStatusLookup', {
      category: LOGGING_CATEGORY,
      status: status,
    })

    try {
      const statusLookup = await this.caseCommunicationStatusModel.findOne({
        where: {
          value: status,
        },
      })

      if (!statusLookup) {
        return handleNotFoundLookup({
          method: 'caseCommunicationStatusLookup',
          entity: 'status',
          id: status,
          category: LOGGING_CATEGORY,
          info: {
            status,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: statusLookup,
      })
    } catch (error) {
      return handleException({
        method: 'caseCommunicationStatusLookup',
        category: LOGGING_CATEGORY,
        message: 'Could not get case communication status',
        error,
        info: {
          status,
        },
      })
    }
  }
  async caseTagLookup(tag: string): Promise<Result<CaseStatusDto>> {
    this.logger.info('caseTagLookup', {
      category: LOGGING_CATEGORY,
      tag: tag,
    })

    try {
      const tagLookup = await this.caseTagModel.findOne({
        where: {
          value: tag,
        },
      })

      if (!tagLookup) {
        return handleNotFoundLookup({
          method: 'caseTagLookup',
          entity: 'tag',
          id: tag,
          category: LOGGING_CATEGORY,
          info: {
            tag,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: tagLookup,
      })
    } catch (error) {
      return handleException({
        method: 'caseTagLookup',
        category: LOGGING_CATEGORY,
        message: 'Could not get case tag',
        error,
        info: {
          tag,
        },
      })
    }
  }
  async caseStatusLookup(status: string): Promise<Result<CaseStatusDto>> {
    this.logger.info('caseStatusLookup', {
      category: LOGGING_CATEGORY,
      status: status,
    })

    try {
      const statusLookup = await this.caseStatusModel.findOne({
        where: {
          value: status,
        },
      })

      if (!statusLookup) {
        return handleNotFoundLookup({
          method: 'caseStatusLookup',
          entity: 'status',
          id: status,
          category: LOGGING_CATEGORY,
          info: {
            status,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: statusLookup,
      })
    } catch (error) {
      return handleException({
        method: 'caseStatusLookup',
        category: LOGGING_CATEGORY,
        message: 'Could not get case status',
        error,
        info: {
          status,
        },
      })
    }
  }
  async generateCaseNumber(): Promise<Result<string>> {
    this.logger.info('generateCaseNumber', {
      category: LOGGING_CATEGORY,
    })

    try {
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

      return Promise.resolve({
        ok: true,
        value: caseNumber,
      })
    } catch (error) {
      return handleException({
        method: 'generateCaseNumber',
        category: LOGGING_CATEGORY,
        message: 'Could not generate case number',
        error,
      })
    }
  }
  async caseLookupByApplicationId(
    applicationId: string,
  ): Promise<Result<CaseDto>> {
    this.logger.info('caseLookupByApplicationId', {
      category: LOGGING_CATEGORY,
      applicationId: applicationId,
    })

    try {
      const found = await this.caseModel.findOne({
        where: {
          applicationId: applicationId,
        },
      })

      if (!found) {
        return handleNotFoundLookup({
          method: 'caseLookupByApplicationId',
          entity: 'case',
          id: applicationId,
          category: LOGGING_CATEGORY,
          info: {
            applicationId,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: found,
      })
    } catch (error) {
      return handleException({
        method: 'caseLookupByApplicationId',
        category: LOGGING_CATEGORY,
        message: 'Could not get case',
        error,
        info: {
          applicationId,
        },
      })
    }
  }
  async caseLookup(caseId: string): Promise<Result<CaseDto>> {
    this.logger.info('caseLookup', {
      category: LOGGING_CATEGORY,
      caseId: caseId,
    })

    try {
      const found = await this.caseModel.findByPk(caseId, {
        include: CASE_RELATIONS,
      })

      if (!found) {
        return handleNotFoundLookup({
          method: 'caseLookup',
          entity: 'case',
          id: caseId,
          category: LOGGING_CATEGORY,
          info: {
            caseId,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: found,
      })
    } catch (error) {
      return handleException({
        method: 'caseLookup',
        category: LOGGING_CATEGORY,
        message: 'Could not get case',
        error,
        info: {
          caseId,
        },
      })
    }
  }

  async getCaseWithAdvert(caseId: string): Promise<Result<CaseWithAdvert>> {
    this.logger.info('getCaseWithAdvert', {
      category: LOGGING_CATEGORY,
      caseId: caseId,
    })
    try {
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
        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Could not find involved party <195eccdc-baf3-4cec-97ac-ef1c5161b091>`,
          },
        })
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
        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Could not find signature date`,
          },
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

      return Promise.resolve({
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
      })
    } catch (error) {
      return handleException({
        method: 'getCaseWithAdvert',
        category: LOGGING_CATEGORY,
        message: 'Could not get case with advert',
        error,
        info: {
          caseId,
        },
      })
    }
  }
}
