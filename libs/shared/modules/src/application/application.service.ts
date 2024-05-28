import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  Application,
  CaseCommentPublicity,
  CaseCommentType,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  PostCaseCommentResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'

import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { AuthService } from '../auth/auth.service'
import { ICaseService } from '../case/case.module'
import { ICommentService } from '../comment/comment.service.interface'
import { Result } from '../types/result'
import { IApplicationService } from './application.service.interface'

const LOGGING_CATEGORY = 'application-service'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICommentService)
    private readonly commentService: ICommentService,
    @Inject(forwardRef(() => ICaseService))
    private readonly caseService: ICaseService,
    private readonly authService: AuthService,
  ) {
    this.logger.info('Using ApplicationService')
  }

  private xroadFetch = async (url: string, options: RequestInit) => {
    const idsToken = await this.authService.getAccessToken()

    if (!idsToken) {
      this.logger.error('Could not get access token from auth service', {
        category: LOGGING_CATEGORY,
      })
      throw new Error('Could not get access token from auth service')
    }

    const xroadClient = process.env.XROAD_DMR_CLIENT
    if (!xroadClient) {
      this.logger.error('Missing required environment')
      throw new Error('Missing required environment')
    }

    this.logger.info(`${options.method}: ${url}`, {
      category: LOGGING_CATEGORY,
      url: url,
    })

    const requestOption = {
      ...options,
      headers: {
        ...options.headers,
        'X-Road-Client': xroadClient,
      },
    }

    return await fetch(url, {
      ...requestOption,
      headers: {
        ...requestOption.headers,
        Authorization: `Bearer ${idsToken.access_token}`,
      },
    })
  }

  async getApplication(id: string): Promise<Result<GetApplicationResponse>> {
    this.logger.info('getAdvert', {
      applicationId: id,
      category: LOGGING_CATEGORY,
    })

    try {
      const res = await this.xroadFetch(
        `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
        {
          method: 'GET',
        },
      )

      if (res.status != 200) {
        this.logger.error(`Could not get application<${id}>`, {
          applicationId: id,
          status: res.status,
          category: LOGGING_CATEGORY,
        })
        return Promise.resolve({
          ok: false,
          error: {
            code: res.status,
            message: `Could not get application<${id}>`,
          },
        })
      }

      const application: Application = await res.json()

      return Promise.resolve({
        ok: true,
        value: { application: application },
      })
    } catch (error) {
      this.logger.error(`Error in getApplication`, {
        error: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
        applicationId: id,
        category: LOGGING_CATEGORY,
      })
      return {
        ok: false,
        error: {
          code: 500,
          message: `Could not get application<${id}>`,
        },
      }
    }
  }

  async submitApplication(id: string): Promise<Result<undefined>> {
    // This method handles state transitions of the application from admin system
    this.logger.info('submitApplication', {
      id,
      category: LOGGING_CATEGORY,
    })

    try {
      const res = await this.xroadFetch(
        `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}/submit`,
        {
          method: 'PUT',
          body: new URLSearchParams({
            event: 'REJECT',
          }),
        },
      )

      if (res.status !== 200) {
        this.logger.error('Error in submitApplication', {
          status: res.status,
          category: LOGGING_CATEGORY,
        })
        return Promise.resolve({
          ok: false,
          error: {
            code: res.status,
            message: 'Could not submit application',
          },
        })
      }

      const newCase = await this.caseService.create({
        applicationId: id,
      })

      return Promise.resolve({ ok: true, value: undefined })
    } catch (error) {
      this.logger.error('Error in submitAppication', {
        error,
        category: LOGGING_CATEGORY,
        id: id,
      })
      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: 'Could not submit application',
        },
      })
    }
  }

  async updateApplication(id: string, answers: UpdateApplicationBody) {
    this.logger.info('updateApplication', {
      id,
      answers: { ...answers },
      category: LOGGING_CATEGORY,
    })

    try {
      const res = await this.xroadFetch(
        `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
        {
          method: 'POST',
          body: new URLSearchParams({
            id: id,
            answers: JSON.stringify(answers),
          }),
        },
      )

      if (res.status !== 200) {
        this.logger.error('Could not update application', {
          status: res.status,
          category: LOGGING_CATEGORY,
        })
        return null
      } else {
        this.logger.info('Application updated', {
          id,
          category: LOGGING_CATEGORY,
        })
        return await res.json()
      }
    } catch (error) {
      this.logger.error('Exception occured, could not update application', {
        error,
        category: LOGGING_CATEGORY,
      })
      return null
    }
  }

  async postApplication(applicationId: string): Promise<Result<undefined>> {
    this.logger.info('postApplication', {
      applicationId,
      category: LOGGING_CATEGORY,
    })

    try {
      const caseResponse = await this.caseService.cases({
        applicationId,
      })

      const found = caseResponse.cases.find(
        (c) => c.applicationId === applicationId,
      )

      const application = await this.getApplication(applicationId)

      if (!application.ok) {
        this.logger.error('Application not found', {
          applicationId,
          category: LOGGING_CATEGORY,
        })

        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Application with id<${applicationId}> not found`,
          },
        })
      }

      if (found) {
        await this.commentService.create(found.id, {
          internal: true,
          type: CaseCommentType.Submit,
          comment: null,
          from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
          to: null,
          state: JSON.stringify(application),
        })

        return Promise.resolve({
          ok: true,
          value: undefined,
        })
      } else {
        await this.caseService.create({
          applicationId,
        })

        return Promise.resolve({
          ok: true,
          value: undefined,
        })
      }
    } catch (error) {
      this.logger.error('Error in postApplication', {
        error,
        applicationId,
        category: LOGGING_CATEGORY,
      })

      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: `Could not create case for application applicationId<${applicationId}>`,
        },
      })
    }
  }

  async getComments(
    applicationId: string,
  ): Promise<Result<GetCaseCommentsResponse>> {
    this.logger.info('Getting comments for application', {
      applicationId,
      category: LOGGING_CATEGORY,
    })

    try {
      const caseResponse = await this.caseService.cases({
        applicationId,
      })

      const activeCase = caseResponse.cases.find(
        (c) => c.applicationId === applicationId,
      )

      if (!activeCase) {
        this.logger.error('Case not found', {
          applicationId,
          category: LOGGING_CATEGORY,
        })

        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Case with applicationId<${applicationId}> not found`,
          },
        })
      }

      const comments = await this.commentService.comments(activeCase.id, {
        type: CaseCommentPublicity.External,
      })

      return Promise.resolve({
        ok: true,
        value: comments,
      })
    } catch (error) {
      this.logger.error('Error in getComments', {
        error,
        applicationId,
        category: LOGGING_CATEGORY,
      })

      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: `Could not get comments for applicationId<${applicationId}>`,
        },
      })
    }
  }

  async postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<Result<PostCaseCommentResponse>> {
    this.logger.info('Posting comment for application', {
      applicationId,
      category: LOGGING_CATEGORY,
    })

    try {
      const caseResponse = await this.caseService.cases({
        applicationId,
      })

      const activeCase = caseResponse.cases.find(
        (c) => c.applicationId === applicationId,
      )

      if (!activeCase) {
        this.logger.error('Case not found', {
          applicationId,
          category: LOGGING_CATEGORY,
        })

        return Promise.resolve({
          ok: false,
          error: {
            code: 404,
            message: `Case with applicationId<${applicationId}> not found`,
          },
        })
      }

      const created = await this.commentService.create(activeCase.id, {
        comment: commentBody.comment,
        from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
        to: null,
        internal: false,
        type: CaseCommentType.Comment,
        state: null,
      })

      if (!created) {
        this.logger.error('Could not create comment', {
          applicationId,
          category: LOGGING_CATEGORY,
        })

        return Promise.resolve({
          ok: false,
          error: {
            code: 500,
            message: `Could not create comment for applicationId<${applicationId}>`,
          },
        })
      }

      return Promise.resolve({
        ok: true,
        value: created,
      })
    } catch (error) {
      this.logger.error('Error in postComment', {
        error,
        applicationId,
        category: LOGGING_CATEGORY,
      })

      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: `Could not create comment for applicationId<${applicationId}>`,
        },
      })
    }
  }
}
