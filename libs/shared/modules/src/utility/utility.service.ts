import { Op } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { CaseWithAdvert } from '@dmr.is/shared/dto'

import { Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
} from '../case/models'
import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../comment/models'
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
  ) {
    this.logger.info('Using UtilityService')
  }

  async getCaseWithAdvert(caseId: string): Promise<Result<CaseWithAdvert>> {
    this.logger.info('getCaseWithAdvert', {
      category: LOGGING_CATEGORY,
      caseId: caseId,
    })
    try {
      const found = await this.caseModel.findByPk(caseId, {
        include: [
          CaseTagDto,
          CaseStatusDto,
          CaseCommunicationStatusDto,
          {
            model: CaseCommentDto,
            include: [
              {
                model: CaseCommentTaskDto,
                include: [CaseCommentTitleDto],
              },
              CaseStatusDto,
              CaseCommentTypeDto,
            ],
          },
        ],
      })

      if (!found) {
        this.logger.warn(`getCaseWithAdvert, could not find case<${caseId}>`, {
          caseId: caseId,
          category: LOGGING_CATEGORY,
        })
        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Could not find case<${caseId}>`,
          },
        })
      }

      const activeCase = caseMigrate(found)

      const applicationResponse = await this.applicationService.getApplication(
        activeCase.applicationId,
      )

      if (!applicationResponse.ok) {
        this.logger.warn(
          `getCaseWithAdvert, could not find application <${activeCase.applicationId}`,
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
            message: `Could not find application <${activeCase.applicationId}`,
          },
        })
      }

      const application = applicationResponse.value.application

      const department = await this.departmentModel.findByPk(
        application.answers.advert.department,
      )

      if (!department) {
        this.logger.warn(
          `getCaseWithAdvert, could not find department <${application.answers.advert.department}>`,
          {
            caseId: caseId,
            departmentId: application.answers.advert.department,
            category: LOGGING_CATEGORY,
          },
        )
        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Could not find department <${application.answers.advert.department}>`,
          },
        })
      }

      const type = await this.typeDto.findByPk(application.answers.advert?.type)
      if (!type) {
        this.logger.warn(
          `getCaseWithAdvert, could not find type <${application.answers.advert.type}>`,
          {
            caseId: caseId,
            typeId: application.answers.advert.type,
            applicationId: activeCase.applicationId,
            category: LOGGING_CATEGORY,
          },
        )
        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Could not find type <${application.answers.advert.type}>`,
          },
        })
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
          },
        },
      })
    } catch (error) {
      this.logger.error('Error in getCaseWithAdvert', {
        caseId: caseId,
        category: LOGGING_CATEGORY,
        error: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
      })

      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: 'Could not get case with advert',
        },
      })
    }
  }
}
