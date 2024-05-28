import { Op } from 'sequelize'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { CaseWithAdvert } from '@dmr.is/shared/dto'

import {
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
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

  async getCaseWithAdvert(caseId: string): Promise<CaseWithAdvert | null> {
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
        this.logger.warn(`Could not find case<${caseId}>`, {
          category: LOGGING_CATEGORY,
          caseId: caseId,
        })

        return null
      }

      const activeCase = caseMigrate(found)

      const applicationResponse = await this.applicationService.getApplication(
        activeCase.applicationId,
      )

      if (!applicationResponse.ok) {
        this.logger.error('Failed to get application', {
          category: LOGGING_CATEGORY,
          applicationId: activeCase.applicationId,
          caseId: caseId,
          error: applicationResponse.error,
        })

        return null
      }

      const application = applicationResponse.value.application

      // application.answers.advert?.department, only mock data here still using fixed for now (A-deild)
      const department = await this.departmentModel.findByPk(
        '69cd3e90-106e-4b9c-8419-148c29e1738a',
      )

      if (!department) {
        throw new NotFoundException(`Department with id not found`)
      }

      // const type = await this.typeDto.findByPk(application.answers.advert?.type)
      const type = await this.typeDto.findByPk(
        'cb2c8386-bd1e-4e52-883c-260aa9f642de',
      )
      if (!type) {
        throw new NotFoundException(
          `Type with id ${application.answers.advert?.type} not found`,
        )
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
        throw new NotFoundException(`Involved party with id not found`)
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
        throw new NotFoundException(`Signature date not found`)
      }

      return Promise.resolve({
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
      })
    } catch (error) {
      console.log(error)
      this.logger.error('Error in getCaseWithAdvert', {
        category: LOGGING_CATEGORY,
        error,
      })

      throw new InternalServerErrorException('Failed to get case with advert')
    }
  }
}
