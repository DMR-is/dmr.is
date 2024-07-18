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
import { ResultWrapper } from '@dmr.is/types'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

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
  async getPrice(
    applicationId: string,
  ): Promise<ResultWrapper<CasePriceResponse>> {
    const caseLookup = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    const activeCase = caseMigrate(caseLookup)

    return ResultWrapper.ok({
      price: activeCase.price || 0,
    })
  }

  @Audit()
  @HandleException()
  async getApplication(
    id: string,
  ): Promise<ResultWrapper<GetApplicationResponse>> {
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
      return ResultWrapper.err({
        code: res.status,
        message: `Could not get application<${id}>`,
      })
    }

    const application: Application = await res.json()

    return ResultWrapper.ok({
      application,
    })
  }

  @Audit()
  @HandleException()
  async submitApplication(id: string): Promise<ResultWrapper<undefined>> {
    const res = await this.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}/submit`,
      {
        method: 'PUT',
        body: new URLSearchParams({
          event: 'REJECT',
        }),
      },
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newCase = await this.caseService.create({
      applicationId: id,
    })

    return ResultWrapper.ok(undefined)
  }

  @Audit()
  @HandleException()
  async updateApplication(
    id: string,
    answers: UpdateApplicationBody,
  ): Promise<ResultWrapper<undefined>> {
    const res = await this.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      },
    )

    if (!res.ok) {
      const { status, statusText } = res
      this.logger.warn(`Could not update application<${id}>`, {
        category: LOGGING_CATEGORY,
        status,
        statusText,
      })
      switch (res.status) {
        case 400: {
          throw new BadRequestException()
        }
        case 404: {
          throw new NotFoundException(`Application<${id}> not found`)
        }
        default: {
          throw new InternalServerErrorException(
            `Could not update application<${id}>`,
          )
        }
      }
    }

    return ResultWrapper.ok(undefined)
  }

  @Audit()
  @HandleException()
  async postApplication(
    applicationId: string,
  ): Promise<ResultWrapper<undefined>> {
    try {
      const caseLookup = (
        await this.utilityService.caseLookupByApplicationId(applicationId)
      ).unwrap()

      await this.commentService.create(caseLookup.id, {
        internal: true,
        type: CaseCommentType.Submit,
        comment: null,
        from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
        to: null,
      })

      return ResultWrapper.ok(undefined)
    } catch (error) {
      if (error instanceof NotFoundException) {
        const createResult = await this.caseService.create({
          applicationId,
        })

        createResult.unwrap()

        return ResultWrapper.ok(undefined)
      }
    }

    throw new InternalServerErrorException(
      `Could not post application<${applicationId}>`,
    )
  }

  @Audit()
  @HandleException()
  async getComments(
    applicationId: string,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>> {
    const caseResponse = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    const commentsResult = (
      await this.commentService.comments(caseResponse.id, {
        type: CaseCommentPublicity.External,
      })
    ).unwrap()

    return ResultWrapper.ok({
      comments: commentsResult.comments,
    })
  }

  @Audit()
  @HandleException()
  async postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<ResultWrapper<PostCaseCommentResponse>> {
    const caseLookup = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    const createdResult = (
      await this.commentService.create(caseLookup.id, {
        comment: commentBody.comment,
        from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
        to: null,
        internal: false,
        type: CaseCommentType.Comment,
      })
    ).unwrap()

    return ResultWrapper.ok({
      comment: createdResult.comment,
    })
  }
}
