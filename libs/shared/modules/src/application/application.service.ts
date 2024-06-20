import { Audit, HandleException } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  Application,
  CaseCommentPublicity,
  CaseCommentType,
  CasePriceResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  PostCaseCommentResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

import { forwardRef, Inject, Injectable } from '@nestjs/common'

import { AuthService } from '../auth/auth.service'
import { ICaseService } from '../case/case.module'
import { ICommentService } from '../comment/comment.service.interface'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { IUtilityService } from '../utility/utility.service.interface'
import { IApplicationService } from './application.service.interface'

const LOGGING_CATEGORY = 'application-service'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IUtilityService))
    private readonly utilityService: IUtilityService,
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
      this.logger.error(
        'xroadFetch, could not get access token from auth service',
        {
          category: LOGGING_CATEGORY,
        },
      )
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

  @Audit()
  @HandleException()
  async getPrice(applicationId: string): Promise<Result<CasePriceResponse>> {
    const caseLookup = await this.utilityService.caseLookupByApplicationId(
      applicationId,
    )

    if (!caseLookup.ok) {
      return caseLookup
    }

    const activeCase = caseMigrate(caseLookup.value)

    return {
      ok: true,
      value: { price: activeCase.price ?? 0 },
    }
  }

  @Audit()
  @HandleException()
  async getApplication(id: string): Promise<Result<GetApplicationResponse>> {
    const res = await this.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
      {
        method: 'GET',
      },
    )

    if (res.status != 200) {
      this.logger.error(`getApplication, could not get application<${id}>`, {
        applicationId: id,
        status: res.status,
        category: LOGGING_CATEGORY,
      })
      return {
        ok: false,
        error: {
          code: res.status,
          message: `Could not get application<${id}>`,
        },
      }
    }

    const application: Application = await res.json()

    return {
      ok: true,
      value: { application: application },
    }
  }

  @Audit()
  @HandleException()
  async submitApplication(id: string): Promise<Result<undefined>> {
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
      return {
        ok: false,
        error: {
          code: res.status,
          message: 'Could not submit application',
        },
      }
    }

    const newCase = await this.caseService.create({
      applicationId: id,
    })

    return { ok: true, value: undefined }
  }

  @Audit()
  async updateApplication(id: string, answers: UpdateApplicationBody) {
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
        this.logger.error('updateApplicaton, could not update application', {
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

  @Audit()
  @HandleException()
  async postApplication(applicationId: string): Promise<Result<undefined>> {
    const caseLookup = await this.utilityService.caseLookupByApplicationId(
      applicationId,
    )

    // this means that the case does not exist, so we need to create it
    if (!caseLookup.ok) {
      const createResult = await this.caseService.create({
        applicationId,
      })

      if (!createResult.ok) {
        return createResult
      }

      return {
        ok: true,
        value: undefined,
      }
    }

    const applicationLookup = await this.getApplication(applicationId)

    if (!applicationLookup.ok) {
      return applicationLookup
    }

    await this.commentService.create(caseLookup.value.id, {
      internal: true,
      type: CaseCommentType.Submit,
      comment: null,
      from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
      to: null,
    })

    return {
      ok: true,
      value: undefined,
    }
  }

  @Audit()
  @HandleException()
  async getComments(
    applicationId: string,
  ): Promise<Result<GetCaseCommentsResponse>> {
    const caseResponse = await this.utilityService.caseLookupByApplicationId(
      applicationId,
    )

    if (!caseResponse.ok) {
      return caseResponse
    }

    const commentsResult = await this.commentService.comments(
      caseResponse.value.id,
      {
        type: CaseCommentPublicity.External,
      },
    )

    if (!commentsResult.ok) {
      return commentsResult
    }

    return {
      ok: true,
      value: commentsResult.value,
    }
  }

  @Audit()
  @HandleException()
  async postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<Result<PostCaseCommentResponse>> {
    const caseLookup = await this.utilityService.caseLookupByApplicationId(
      applicationId,
    )

    if (!caseLookup.ok) {
      return caseLookup
    }

    const createdResult = await this.commentService.create(
      caseLookup.value.id,
      {
        comment: commentBody.comment,
        from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
        to: null,
        internal: false,
        type: CaseCommentType.Comment,
      },
    )

    if (!createdResult.ok) {
      return createdResult
    }

    return {
      ok: true,
      value: createdResult.value,
    }
  }
}
