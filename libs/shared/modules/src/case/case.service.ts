import { isBooleanString } from 'class-validator'
import { v4 as uuid } from 'uuid'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_CASES, ALL_MOCK_USERS } from '@dmr.is/mocks'
import {
  ApplicationAnswerOption,
  Case,
  CaseComment,
  CaseCommentPublicity,
  CaseCommunicationStatus,
  CaseEditorialOverview,
  CaseHistory,
  CaseStatus,
  CaseTag,
  CaseWithApplication,
  GetCaseCommentsQuery,
  GetCasesQuery,
  GetCasesReponse,
  GetCasesWithApplicationReponse,
  GetUsersQueryParams,
  GetUsersResponse,
  PostApplicationBody,
  PostCaseComment,
  PostCasePublishBody,
} from '@dmr.is/shared/dto'
import {
  generatePaging,
  mapCaseCommentTypeToCaseCommentTitle,
} from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

// import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
// import { HTMLText } from '@island.is/regulations-tools/types'
import { IApplicationService } from '../application/application.service.interface'
import { IJournalService } from '../journal/journal.service.interface'
import { ICaseService } from './case.service.interface'

const LOGGING_CATEGORY = 'CaseService'

export class CaseService implements ICaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IApplicationService))
    private readonly applicationService: IApplicationService,

    @Inject(forwardRef(() => IJournalService))
    private readonly journalService: IJournalService,
  ) {
    this.logger.info('Using CaseService')
  }
  getCaseHistory(caseId: string): Promise<CaseHistory> {
    throw new Error('Method not implemented.')
  }

  private async getLatestApplication(theCase: Case) {
    if (!theCase.history.length) {
      this.logger.error('Case history is missing or empty', {
        id: theCase.id,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Case history is missing or empty')
    }

    return theCase.history[theCase.history.length - 1]
  }

  private async convertToCaseWithApplication(
    theCase: Case,
  ): Promise<CaseWithApplication> {
    const application = await this.getLatestApplication(theCase)

    if (!application.answers.advert?.department) {
      this.logger.error('Department is missing', {
        id: theCase.id,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Department is missing')
    }

    const { department } = await this.journalService.getDepartment(
      application.answers.advert.department,
    )

    if (!department) {
      this.logger.error(
        `Department with id ${application.answers.advert.department} not found`,
        {
          id: theCase.id,
          departmentId: application.answers.advert.department,
          category: LOGGING_CATEGORY,
        },
      )
      throw new InternalServerErrorException(
        `Department with id ${application.answers.advert.department} not found`,
      )
    }

    const advertTitle = application.answers.advert.title

    if (!advertTitle) {
      this.logger.error('Advert title is missing or empty', {
        id: theCase.id,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Advert title is missing or empty')
    }

    const requestedPublicationDate = application.answers.publishing?.date

    if (!requestedPublicationDate) {
      this.logger.error('Advert request publication date is empty or missing', {
        id: theCase.id,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException(
        'Advert request publication date is empty or missing',
      )
    }

    if (!application.applicant) {
      this.logger.error('Advert applicant is empty or missing', {
        id: theCase.id,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException('Advert applicant is empty or missing')
    }
    const { institution } = await this.journalService.getInstitution(
      application.applicant,
    )

    return {
      caseId: theCase.id,
      applicationId: theCase.applicationId,
      publicationNumber: null,
      advertDepartment: department.title,
      advertTitle: advertTitle,
      requestedPublicationDate: requestedPublicationDate,
      communicationStatus: theCase.communicationStatus,
      createdDate: theCase.createdAt,
      tag: theCase.tag,
      fastTrack: theCase.fastTrack,
      assignee: theCase.assignedTo?.name || null,
      institutionTitle: institution?.title || null,
    }
  }

  async createCase(body: PostApplicationBody): Promise<Case> {
    try {
      this.logger.info('Creating case', {
        applicationId: body.applicationId,
        category: LOGGING_CATEGORY,
      })

      const application = await this.applicationService.getApplication(
        body.applicationId,
      )

      if (!application) {
        throw new NotFoundException('Application not found')
      }

      // if (
      //   !application.answers.advert?.department ||
      //   !application.answers.publishing?.date ||
      //   !application.answers.advert?.title ||
      //   !application.answers.advert?.type
      // ) {
      //   // this should not happen
      //   throw new BadRequestException('Missing required fields')
      // }

      const now = new Date()

      // const history: CaseHistory = {
      //   date: now.toISOString(),
      //   department: application.answers.advert?.department,
      //   requestedPublicationDate: application.answers.publishing?.date,
      //   subject: application.answers.advert?.title,
      //   type: application.answers.advert?.type,
      // }

      const newCase: Case = {
        id: uuid(),
        isLegacy: false,
        caseNumber: 0,
        applicationId: body.applicationId,
        assignedTo: null,
        communicationStatus: CaseCommunicationStatus.NotStarted,
        createdAt: now.toISOString(),
        modifiedAt: now.toISOString(),
        history: [application],
        paid: false,
        price: 23000,
        published: false,
        publishedAt: null,
        status: CaseStatus.Submitted,
        year: now.getFullYear(),
        fastTrack:
          application.answers.publishing?.fastTrack ===
            ApplicationAnswerOption.YES || false,
        comments: [],
        tag: CaseTag.NotStarted,
      }

      this.logger.info('Successfully created case', {
        caseId: newCase.id,
        category: LOGGING_CATEGORY,
      })

      return Promise.resolve(newCase)
    } catch (error) {
      this.logger.error('Error creating case', {
        error,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Internal server error.')
    }
  }

  async updateCaseHistory(caseId: string): Promise<Case> {
    this.logger.info('Updating case history', {
      id: caseId,
      category: LOGGING_CATEGORY,
    })

    const theCase = ALL_MOCK_CASES.find((c) => c.id === caseId)

    if (!theCase) {
      throw new NotFoundException('Case not found')
    }

    const application = await this.applicationService.getApplication(
      theCase.applicationId,
    )

    if (!application) {
      throw new NotFoundException('Application not found')
    }

    // if (
    //   !application.answers.advert?.department ||
    //   !application.answers.publishing?.date ||
    //   !application.answers.advert?.title ||
    //   !application.answers.advert?.type
    // ) {
    //   // this should not happen
    //   throw new BadRequestException('Missing required fields')
    // }

    theCase.history.push(application)

    return Promise.resolve(theCase)
  }

  getCase(id: string): Promise<Case | null> {
    this.logger.info('Getting case', {
      id,
      category: LOGGING_CATEGORY,
    })
    const found = ALL_MOCK_CASES.find((c) => c.id === id)

    if (!found) {
      throw new NotFoundException('Case not found')
    }

    return Promise.resolve(found)
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

  async getCaseWithApplication(
    id: string,
  ): Promise<CaseWithApplication | null> {
    this.logger.info('Getting case with application', {
      id,
      category: LOGGING_CATEGORY,
    })

    return this.getCase(id).then(async (theCase) => {
      if (!theCase) {
        return null
      }

      return await this.convertToCaseWithApplication(theCase)
    })
  }

  async getCasesWithApplication(
    params?: GetCasesQuery | undefined,
  ): Promise<GetCasesWithApplicationReponse> {
    try {
      const { cases, paging } = await this.getCases(params)

      const casesWithApplication = await Promise.all(
        cases.map(async (c) => await this.convertToCaseWithApplication(c)),
      )

      this.logger.log('Successfully fetched cases with application', {
        category: LOGGING_CATEGORY,
      })

      return {
        cases: casesWithApplication,
        paging,
      }
    } catch (error) {
      throw new InternalServerErrorException('Internal server error.')
    }
  }

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

  async getEditorialOverview(
    params?: GetCasesQuery,
  ): Promise<CaseEditorialOverview> {
    const submitted: Case[] = []
    const inProgress: Case[] = []
    const inReview: Case[] = []
    const ready: Case[] = []

    if (!params?.status) {
      throw new BadRequestException('Missing status')
    }

    ALL_MOCK_CASES.forEach((c) => {
      if (c.status === CaseStatus.Submitted) {
        submitted.push(c)
      } else if (c.status === CaseStatus.InProgress) {
        inProgress.push(c)
      } else if (c.status === CaseStatus.InReview) {
        inReview.push(c)
      } else if (c.status === CaseStatus.ReadyForPublishing) {
        ready.push(c)
      }
    })

    const { cases, paging } = await this.getCases(params)

    try {
      const casesWithApplication = await Promise.all(
        cases.map(async (c) => await this.convertToCaseWithApplication(c)),
      )

      return Promise.resolve({
        data: casesWithApplication,
        totalItems: {
          submitted: submitted.length,
          inProgress: inProgress.length,
          inReview: inReview.length,
          ready: ready.length,
        },
        paging,
      })
    } catch (error) {
      throw new InternalServerErrorException('Internal server error.')
    }
  }

  postCasesPublish(body: PostCasePublishBody): Promise<void> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException('Missing ids')
    }

    try {
      const cases = caseIds.map((id) => {
        const found = ALL_MOCK_CASES.find((c) => c.id === id)

        if (!found) {
          throw new NotFoundException('Case not found')
        }

        return found
      })

      const now = new Date().toISOString()
      cases.forEach((c) => {
        c.modifiedAt = now
        c.publishedAt = now
        c.published = true
      })

      return Promise.resolve()
    } catch (error) {
      throw new InternalServerErrorException('Internal server error.')
    }
  }

  getComments(
    caseId: string,
    params?: GetCaseCommentsQuery,
  ): Promise<CaseComment[]> {
    this.logger.info('Getting comments for case', {
      id: caseId,
      category: LOGGING_CATEGORY,
    })

    const found = ALL_MOCK_CASES.find((c) => c.id === caseId)

    if (!found) {
      this.logger.warn('Case not found', {
        id: caseId,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException('Case not found')
    }

    if (params?.type && params?.type !== CaseCommentPublicity.All) {
      const internal = params.type === CaseCommentPublicity.Internal

      console.log(internal)

      const filtered = found.comments.filter(
        (c) => c.internal === (CaseCommentPublicity.Internal === params.type),
      )

      return Promise.resolve(filtered)
    }

    return Promise.resolve(found.comments)
  }

  async postComment(
    caseId: string,
    body: PostCaseComment,
  ): Promise<CaseComment[]> {
    this.logger.info('Adding comment to application', {
      id: caseId,
      category: LOGGING_CATEGORY,
    })

    const theCase = await this.getCase(caseId)

    if (!theCase) {
      this.logger.warn('Case not found', {
        id: caseId,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException('Case not found')
    }

    const newCommentTitle = mapCaseCommentTypeToCaseCommentTitle(body.type)
    if (!newCommentTitle) {
      this.logger.warn('Invalid comment type', {
        id: caseId,
        category: LOGGING_CATEGORY,
      })
      throw new BadRequestException('Invalid comment type')
    }

    const newComment: CaseComment = {
      id: uuid(),
      caseStatus: theCase.status,
      createdAt: new Date().toISOString(),
      internal: body.internal,
      type: body.type,
      task: {
        to: body.to,
        from: body.from,
        comment: body.comment,
        title: newCommentTitle,
      },
    }

    // TODO: plug into db when rdy

    return Promise.resolve([...theCase.comments, newComment])
  }

  async deleteComment(
    caseId: string,
    commentId: string,
  ): Promise<CaseComment[]> {
    this.logger.info('Deleting comment from application', {
      id: caseId,
      commentId,
      category: LOGGING_CATEGORY,
    })

    const caseComments = await this.getComments(caseId)

    if (!caseComments) {
      throw new NotFoundException('Case not found')
    }

    const found = caseComments.find((c) => c.id === commentId)

    if (!found) {
      this.logger.warn('Comment not found', {
        id: caseId,
        commentId,
        category: LOGGING_CATEGORY,
      })
      throw new NotFoundException('Comment not found')
    }

    const newComments = caseComments.filter((c) => c.id !== commentId)

    // TODO: plug into db when rdy

    return Promise.resolve(newComments)
  }
}
