import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_CASES, ALL_MOCK_USERS, REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  Case,
  CaseCommentType,
  CaseCommunicationStatus,
  CaseEditorialOverview,
  CaseStatus,
  CaseTag,
  CaseWithAdvert,
  CreateCaseResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

// import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
// import { HTMLText } from '@island.is/regulations-tools/types'
import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../comment/models'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { AdvertDepartmentDTO } from '../journal/models'
import { IUtilityService } from '../utility/utility.service.interface'
import { ICaseService } from './case.service.interface'
import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
} from './models'

const LOGGING_CATEGORY = 'CaseService'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IApplicationService))
    private readonly applicationService: IApplicationService,

    @Inject(forwardRef(() => ICommentService))
    private readonly commentService: ICommentService,

    @Inject(IUtilityService) private readonly utilityService: IUtilityService,

    @InjectModel(CaseDto) private readonly caseModel: typeof CaseDto,
    @InjectModel(CaseStatusDto)
    private readonly caseStatusModel: typeof CaseStatusDto,

    @InjectModel(CaseTagDto) private readonly caseTagModel: typeof CaseTagDto,
    @InjectModel(CaseCommunicationStatusDto)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusDto,

    @InjectModel(AdvertDepartmentDTO)
    private readonly departmentModel: typeof AdvertDepartmentDTO,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }
  getEditorialOverview(
    params?: GetCasesQuery | undefined,
  ): Promise<CaseEditorialOverview> {
    throw new Error('Method not implemented.')
  }

  async createCase(body: PostApplicationBody): Promise<CreateCaseResponse> {
    try {
      this.logger.info('Creating case', {
        applicationId: body.applicationId,
        category: LOGGING_CATEGORY,
      })

      const newCase = await this.sequelize.transaction(async (t) => {
        // check if case with application id already exists

        const existingCase = await this.caseModel.findOne({
          where: {
            applicationId: body.applicationId,
          },
        })

        if (existingCase) {
          throw new BadRequestException(
            'Case with application id already exists',
          )
        }

        const application = await this.applicationService.getApplication(
          body.applicationId,
        )

        if (!application) {
          throw new NotFoundException('Application not found')
        }

        const now = new Date()

        const nextCaseNumber = await this.caseModel.count({
          transaction: t,
          where: {
            year: now.getFullYear(),
            publishedAt: null,
          },
        })

        const caseStatusSubmitted = await this.caseStatusModel.findOne({
          transaction: t,
          where: {
            value: CaseStatus.Submitted,
          },
        })

        if (!caseStatusSubmitted) {
          throw new NotFoundException('Case status not found')
        }

        const caseTag = await this.caseTagModel.findOne({
          transaction: t,
          where: {
            value: CaseTag.NotStarted,
          },
        })

        if (!caseTag) {
          throw new NotFoundException('Case tag not found')
        }

        const caseCommunicationStatus =
          await this.caseCommunicationStatusModel.findOne({
            transaction: t,
            where: {
              value: CaseCommunicationStatus.NotStarted,
            },
          })

        if (!caseCommunicationStatus) {
          throw new NotFoundException('Case communication status not found')
        }

        const department = await this.departmentModel.findByPk(
          application.answers.advert.department,
          {
            transaction: t,
          },
        )

        if (!department) {
          throw new NotFoundException('Department not found')
        }

        const newCase = await this.caseModel.create(
          {
            id: uuid(),
            applicationId: application.id,
            year: now.getFullYear(),
            caseNumber: nextCaseNumber + 1, // start at 1
            statusId: caseStatusSubmitted.id,
            tagId: caseTag.id,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isLegacy: false,
            assignedUserId: null,
            communicationStatusId: caseCommunicationStatus.id,
            publishedAt: null,
            price: null,
            paid: false,
            fastTrack: application.answers.publishing?.fastTrack ?? false,
            departmentId: department,
          },
          {
            returning: ['id'],
            transaction: t,
          },
        )

        // TODO: When auth is setup, use the user id from the token
        await this.commentService.postComment(
          newCase.id,
          {
            internal: true,
            type: CaseCommentType.Submit,
            comment: null,
            from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
            to: null,
          },
          t,
        )

        const activeCase = await this.caseModel.findByPk(newCase.id, {
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
          transaction: t,
        })

        if (!activeCase) {
          throw new InternalServerErrorException('Failed to create case')
        }

        return caseMigrate(activeCase)
      })

      return Promise.resolve({
        case: newCase,
      })
    } catch (error) {
      this.logger.error('Error in createCase', {
        error,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Internal server error.')
    }
  }

  async getCase(id: string): Promise<GetCaseResponse> {
    try {
      const caseWithAdvert = await this.utilityService.getCaseWithAdvert(id)

      return Promise.resolve({
        case: caseWithAdvert,
      })
    } catch (error) {
      this.logger.error('Error in getCase', {
        id,
        category: LOGGING_CATEGORY,
        error,
      })
      throw new InternalServerErrorException('Failed to get case')
    }
  }

  async getCases(params?: GetCasesQuery): Promise<GetCasesReponse> {
    try {
      this.logger.info('Getting cases', {
        category: LOGGING_CATEGORY,
        params,
      })

      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

      if (!params) {
        const cases = await this.caseModel.findAll({
          offset: (page - 1) * pageSize,
          limit: pageSize,
          where: {
            publishedAt: null,
          },
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

        return Promise.resolve({
          cases: cases.map(caseMigrate),
          paging: generatePaging(cases, page, pageSize),
        })
      }

      const cases = await this.caseModel.findAll({
        offset: (page - 1) * pageSize,
        limit: pageSize,
        where: {
          applicationId: params.applicationId,
          year: params.year,
          caseNumber: params.caseNumber,
          assignedUserId: params.employeeId,
          publishedAt:
            params.published === 'true'
              ? { [Op.not]: null }
              : params.published === 'false'
              ? { [Op.is]: null }
              : undefined,
          statusId: params.status,
          assgiendUserId: params.employeeId,
          fastTrack: params.fastTrack,
          createdAt: {
            [Op.gte]: params.fromDate,
            [Op.lte]: params.toDate,
          },
          departmentId: params.department,
        },
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

      return Promise.resolve({
        cases: cases.map((c) => caseMigrate(c)),
        paging: generatePaging(cases, page, pageSize),
      })
    } catch (error) {
      this.logger.error('Error in getCases', {
        category: LOGGING_CATEGORY,
        error,
      })
      throw new InternalServerErrorException('Failed to get cases')
    }
  }

  // async getCaseWithApplication(
  //   id: string,
  // ): Promise<CaseWithApplication | null> {
  //   this.logger.info('Getting case with application', {
  //     id,
  //     category: LOGGING_CATEGORY,
  //   })

  //   return this.getCase(id).then(async (theCase) => {
  //     if (!theCase) {
  //       return null
  //     }

  //     return await this.convertToCaseWithApplication(theCase)
  //   })
  // }

  // async getCasesWithApplication(
  //   params?: GetCasesQuery | undefined,
  // ): Promise<GetCasesWithApplicationReponse> {
  //   try {
  //     const { cases, paging } = await this.getCases(params)

  //     const casesWithApplication = await Promise.all(
  //       cases.map(async (c) => await this.convertToCaseWithApplication(c)),
  //     )

  //     this.logger.log('Successfully fetched cases with application', {
  //       category: LOGGING_CATEGORY,
  //     })

  //     return {
  //       cases: casesWithApplication,
  //       paging,
  //     }
  //   } catch (error) {
  //     throw new InternalServerErrorException('Internal server error.')
  //   }
  // }

  getCaseByApplicationId(applicationId: string): Promise<Case | null> {
    const found = ALL_MOCK_CASES.find((c) => c.applicationId === applicationId)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    // if (found.advert.document.isLegacy) {
    //   found.advert.document.html = dirtyClean(
    //     found.advert.document.html as HTMLText,
    //   )
    // }

    return Promise.resolve(found)
  }

  getUsers(params?: GetUsersQueryParams): Promise<GetUsersResponse> {
    const filtered = ALL_MOCK_USERS.filter((user) => {
      if (params?.search && user.id !== params.search) {
        return false
      }

      if (!user.active) {
        return false
      }

      return true
    })

    return Promise.resolve({
      users: filtered,
    })
  }

  // async getEditorialOverview(
  //   params?: GetCasesQuery,
  // ): Promise<CaseEditorialOverview> {
  //   const submitted: Case[] = []
  //   const inProgress: Case[] = []
  //   const inReview: Case[] = []
  //   const ready: Case[] = []

  //   if (!params?.status) {
  //     throw new BadRequestException('Missing status')
  //   }

  //   ALL_MOCK_CASES.forEach((c) => {
  //     if (c.status === CaseStatus.Submitted) {
  //       submitted.push(c)
  //     } else if (c.status === CaseStatus.InProgress) {
  //       inProgress.push(c)
  //     } else if (c.status === CaseStatus.InReview) {
  //       inReview.push(c)
  //     } else if (c.status === CaseStatus.ReadyForPublishing) {
  //       ready.push(c)
  //     }
  //   })

  //   console.log(params)

  //   const { cases, paging } = await this.getCases(params)

  //   try {
  //     const casesWithApplication = await Promise.all(
  //       cases.map(async (c) => await this.convertToCaseWithApplication(c)),
  //     )

  //     return Promise.resolve({
  //       data: casesWithApplication,
  //       totalItems: {
  //         submitted: submitted.length,
  //         inProgress: inProgress.length,
  //         inReview: inReview.length,
  //         ready: ready.length,
  //       },
  //       paging,
  //     })
  //   } catch (error) {
  //     throw new InternalServerErrorException('Internal server error.')
  //   }
  // }

  postCasesPublish(body: PostCasePublishBody): Promise<void> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException('Missing ids')
    }
    return Promise.resolve()
  }
}
