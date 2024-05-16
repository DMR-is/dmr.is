import { isBooleanString } from 'class-validator'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
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
import { IJournalService } from '../journal/journal.service.interface'
import { caseMigrate } from '../util/migrations/case/case-migrate'
import { ICaseCommentService } from './case.module'
import { ICaseService } from './case.service.interface'
import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
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

    @Inject(forwardRef(() => IJournalService))
    private readonly journalService: IJournalService,

    @Inject(forwardRef(() => ICaseCommentService))
    private readonly commentService: ICaseCommentService,

    @InjectModel(CaseDto) private readonly caseModel: typeof CaseDto,
    @InjectModel(CaseStatusDto)
    private readonly caseStatusModel: typeof CaseStatusDto,

    @InjectModel(CaseTagDto) private readonly caseTagModel: typeof CaseTagDto,
    @InjectModel(CaseCommunicationStatusDto)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusDto,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }
  getEditorialOverview(
    params?: GetCasesQuery | undefined,
  ): Promise<CaseEditorialOverview> {
    throw new Error('Method not implemented.')
  }
  private async convertToCaseWithAdvert(
    theCase: Case,
  ): Promise<CaseWithAdvert> {
    const application = await this.applicationService.getApplication(
      theCase.applicationId,
    )

    if (!application) {
      throw new NotFoundException('Application not found')
    }

    throw new Error('Method not implemented.')

    // if (!application.answers.advert?.department) {
    //   this.logger.error('Department is missing', {
    //     id: theCase.id,
    //     category: LOGGING_CATEGORY,
    //   })
    //   throw new InternalServerErrorException('Department is missing')
    // }

    // const departmentReq = await this.journalService.getDepartment(
    //   application.answers.advert.department,
    // )

    // if (!departmentReq.ok) {
    //   this.logger.error(
    //     `Department with id ${application.answers.advert.department} not found`,
    //     {
    //       id: theCase.id,
    //       departmentId: application.answers.advert.department,
    //       category: LOGGING_CATEGORY,
    //     },
    //   )
    //   throw new InternalServerErrorException(
    //     `Department with id ${application.answers.advert.department} not found`,
    //   )
    // }
    // const dep = departmentReq.value

    // const advertTitle = application.answers.advert.title

    // if (!advertTitle) {
    //   this.logger.error('Advert title is missing or empty', {
    //     id: theCase.id,
    //     category: LOGGING_CATEGORY,
    //   })
    //   throw new InternalServerErrorException('Advert title is missing or empty')
    // }

    // const requestedPublicationDate = application.answers.publishing?.date

    // if (!requestedPublicationDate) {
    //   this.logger.error('Advert request publication date is empty or missing', {
    //     id: theCase.id,
    //     category: LOGGING_CATEGORY,
    //   })
    //   throw new InternalServerErrorException(
    //     'Advert request publication date is empty or missing',
    //   )
    // }

    // if (!application.applicant) {
    //   this.logger.error('Advert applicant is empty or missing', {
    //     id: theCase.id,
    //     category: LOGGING_CATEGORY,
    //   })
    //   throw new NotFoundException('Advert applicant is empty or missing')
    // }
    // const institutionReq = await this.journalService.getInstitution(
    //   application.applicant,
    // )
    // // if (!institutionReq || !institutionReq.institution) {
    // //   throw new NotFoundException('Institution not found')
    // // }

    // const signatureDate =
    //   application.answers.signature?.type === AdvertSignatureType.Regular
    //     ? application.answers.signature?.regular?.at(0)?.date
    //     : application.answers.signature?.committee?.date

    // // TODO: Switch to real types when ready
    // const advertType = await this.journalService.getType(
    //   '9b7492a3-ae8a-4a8e-bc3b-492cb33c96e9', // Using this for now as the application system only has mock types
    // )

    // const contentCategories =
    //   application.answers.publishing?.contentCategories ?? []

    // const categories: Category[] = []

    // const result = await Promise.all(
    //   contentCategories
    //     .map(async (c) => {
    //       const category = await this.journalService.getCategory(c.value)
    //       return category.ok ? category.value.category : null
    //     })
    //     .filter((i) => Boolean(i)),
    // )

    // result.forEach((r) => {
    //   if (r) {
    //     categories.push(r)
    //   }
    // })

    // return {
    //   caseId: theCase.id,
    //   applicationId: theCase.applicationId,
    //   publicationNumber: null,
    //   caseStatus: theCase.status,
    //   document: application.answers.preview.document,
    //   publishDate: theCase.publishedAt,
    //   communicationStatus: theCase.communicationStatus,
    //   createdDate: theCase.createdAt,
    //   tag: theCase.tag,
    //   fastTrack: theCase.fastTrack,
    //   assignedTo: theCase.assignedTo,
    //   caseComments: theCase.comments,
    //   isLegacy: theCase.isLegacy,
    //   paid: theCase.paid,
    //   price: theCase.price,
    //   advertType: advertType.ok ? advertType.value.type : null,
    //   advertDepartment: dep.department,
    //   advertTitle: advertTitle,
    //   requestedPublicationDate: requestedPublicationDate,
    //   institutionTitle: institutionReq.ok
    //     ? institutionReq?.value.institution?.title ?? null
    //     : null,
    //   categories: categories,
    //   signatureDate: signatureDate || null,
    // }
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
      const activeCase = await this.caseModel.findByPk(id, {
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

      if (!activeCase) {
        return Promise.resolve({
          case: null,
        })
      }

      const migrated = caseMigrate(activeCase)

      return Promise.resolve({
        case: migrated,
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

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse> {
    if (!params) {
      return Promise.resolve({
        cases: ALL_MOCK_CASES,
        paging: generatePaging(ALL_MOCK_CASES),
      })
    }

    try {
      const { page, pageSize } = params

      const filteredCases = ALL_MOCK_CASES.filter((c) => {
        if (params?.search) {
          // if (
          //   !c.advert.department.title
          //     .toLowerCase()
          //     .includes(params.search.toLowerCase()) &&
          //   !c.advert.title.toLowerCase().includes(params.search.toLowerCase())
          // ) {
          //   return false
          // }
        }

        if (params.applicationId && c.applicationId !== params.applicationId) {
          return false
        }

        if (params?.caseNumber && c.caseNumber !== params?.caseNumber) {
          return false
        }

        if (
          params?.dateFrom &&
          new Date(c.createdAt) < new Date(params?.dateFrom)
        ) {
          return false
        }

        if (
          params?.dateTo &&
          new Date(c.createdAt) > new Date(params?.dateTo)
        ) {
          return false
        }

        if (params?.status && c.status !== params?.status) {
          return false
        }

        if (params?.fastTrack && isBooleanString(params.fastTrack)) {
          if (c.fastTrack !== Boolean(params.fastTrack)) {
            return false
          }
        }

        if (params?.employeeId && c.assignedTo?.id !== params?.employeeId) {
          return false
        }

        // if (
        //   params?.department &&
        //   c.advert.department.slug !== params.department.toLowerCase()
        // ) {
        //   return false
        // }

        return true
      })

      const withPaging = generatePaging(filteredCases, page, pageSize)
      const pagedCases = filteredCases.slice(
        withPaging.pageSize * (withPaging.page - 1),
        withPaging.pageSize * withPaging.page,
      )
      // pagedCases.forEach((c) => {
      //   if (c.advert.document.isLegacy) {
      //     c.advert.document.html = dirtyClean(
      //       c.advert.document.html as HTMLText,
      //     )
      //   }
      //   return c
      // })

      return Promise.resolve({
        cases: pagedCases,
        paging: withPaging,
      })
    } catch (error) {
      throw new InternalServerErrorException('Internal server error.')
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
