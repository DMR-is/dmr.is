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

  async getCaseWithAdvert(caseId: string): Promise<CaseWithAdvert> {
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
        throw new NotFoundException(`Case with id ${caseId} not found`)
      }

      const activeCase = caseMigrate(found)

      const application = await this.applicationService.getApplication(
        activeCase.applicationId,
      )

      if (!application) {
        throw new NotFoundException(
          `Application with id ${activeCase.applicationId} not found`,
        )
      }

      const [department, type, categories] = await Promise.all([
        await this.departmentModel.findByPk(
          application.answers.advert?.department,
        ),
        await this.typeDto.findByPk(application.answers.advert?.type),
        // await this.involvedPartyModel.findByPk(application.applicant), // TODO: Users not implemented yet
        await this.categoryModel.findAll({
          where: {
            id: {
              in: application.answers.publishing?.contentCategories ?? [],
            },
          },
        }),
      ])

      if (!department) {
        throw new NotFoundException(
          `Department with id ${application.answers.advert?.department} not found`,
        )
      }

      if (!type) {
        throw new NotFoundException(
          `Type with id ${application.answers.advert?.type} not found`,
        )
      }

      // TODO: Implement this when users are implemented
      // if (!involvedParty) {
      //   throw new NotFoundException(
      //     `Involved party with id ${application.applicant} not found`,
      //   )
      // }

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
        case: activeCase,
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
          institution: {
            id: '4f3ea720-1695-481a-ab42-8bd0624c9d20',
            slug: 'reykjavikur-borg',
            title: 'Reykjavíkurborg',
          },
        },
      })
    } catch (error) {
      this.logger.error('Error in getCaseWithAdvert', {
        category: LOGGING_CATEGORY,
        error,
      })

      throw new InternalServerErrorException('Failed to get case with advert')
    }
  }
}
