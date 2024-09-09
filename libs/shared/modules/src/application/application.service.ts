import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import {
  ApplicationEvent,
  AttachmentTypeParams,
  DEFAULT_PRICE,
} from '@dmr.is/constants'
import { LogAndHandle, LogMethod, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Application,
  CaseCommentType,
  CaseCommunicationStatus,
  CasePriceResponse,
  GetApplicationAttachmentsResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationAttachmentBody,
  PostApplicationComment,
  PresignedUrlResponse,
  S3UploadFilesResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { calculatePriceForApplication } from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { IAttachmentService } from '../attachments/attachment.service.interface'
import { AuthService } from '../auth/auth.service'
import { ICaseService } from '../case/case.module'
import { ICommentService } from '../comment/comment.service.interface'
import { IS3Service } from '../s3/s3.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { IApplicationService } from './application.service.interface'

const LOGGING_CATEGORY = 'application-service'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAttachmentService)
    private readonly attachmentService: IAttachmentService,
    @Inject(forwardRef(() => IUtilityService))
    private readonly utilityService: IUtilityService,
    @Inject(ICommentService)
    private readonly commentService: ICommentService,
    @Inject(forwardRef(() => ICaseService))
    private readonly caseService: ICaseService,
    private readonly authService: AuthService,
    @Inject(IS3Service)
    private readonly s3Service: IS3Service,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using ApplicationService')
  }

  @LogMethod()
  private async xroadFetch(url: string, options: RequestInit) {
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

    try {
      return await fetch(url, {
        ...requestOption,
        headers: {
          ...requestOption.headers,
          Authorization: `Bearer ${idsToken.access_token}`,
        },
      })
    } catch (error) {
      this.logger.error('Failed to fetch in ApplicationService.xroadFetch', {
        category: LOGGING_CATEGORY,
        error,
      })
      if (error instanceof TypeError) {
        throw new InternalServerErrorException(
          `${error.name}, ${error.message}`,
        )
      }
      throw new InternalServerErrorException()
    }
  }

  @LogAndHandle()
  async getPrice(
    applicationId: string,
  ): Promise<ResultWrapper<CasePriceResponse>> {
    /**
     * First we check if there is an existing case for the application.
     * If so then we return the price of the case.
     * If not then we calculate the price of the application.
     */
    try {
      const caseLookup = (
        await this.utilityService.caseLookupByApplicationId(applicationId)
      ).unwrap()

      /**
       * If price has not been set we return default price
       */

      const price = caseLookup.price ? caseLookup.price : DEFAULT_PRICE

      return ResultWrapper.ok({
        price: price,
      })
    } catch (error) {
      ResultWrapper.unwrap(await this.getApplication(applicationId))

      // case does not exist, calculate price
      const price = calculatePriceForApplication()

      return ResultWrapper.ok({
        price: price,
      })
    }
  }

  @LogAndHandle()
  async getApplication(
    id: string,
  ): Promise<ResultWrapper<GetApplicationResponse>> {
    const res = await this.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}`,
      {
        method: 'GET',
      },
    )

    if (!res.ok) {
      this.logger.error(
        `Appliction.service.getApplication, could not get application<${id}>`,
        {
          applicationId: id,
          status: res.status,
          category: LOGGING_CATEGORY,
        },
      )
      return ResultWrapper.err({
        code: res.status,
        message: `Application<${id}> not found`,
      })
    }

    const application: Application = await res.json()

    return ResultWrapper.ok({
      application,
    })
  }

  @LogAndHandle()
  async submitApplication(
    id: string,
    event: ApplicationEvent,
  ): Promise<ResultWrapper> {
    const res = await this.xroadFetch(
      `${process.env.XROAD_ISLAND_IS_PATH}/application-callback-v2/applications/${id}/submit`,
      {
        method: 'PUT',
        body: new URLSearchParams({
          event: event,
        }),
      },
    )

    if (!res.ok) {
      throw new InternalServerErrorException(
        `Could not submit application<${id}>`,
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateApplication(
    id: string,
    answers: UpdateApplicationBody,
  ): Promise<ResultWrapper> {
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
      const info = await res.json()
      const { status, statusText } = res
      this.logger.warn(`Could not update application<${id}>`, {
        category: LOGGING_CATEGORY,
        details: info,
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
          const resInfo = await res.text()
          throw new InternalServerErrorException(
            `Could not update application<${id}>, ${resInfo}`,
          )
        }
      }
    }

    return ResultWrapper.ok()
  }

  /**
   * Posts an application.
   * If case with the given applicationId does not exist, it will be created.
   * If case with the given applicationId already exists, it will be reposted.
   *
   * @param applicationId - The ID of the application to be posted.
   * @returns A `ResultWrapper` containing the result of the operation.
   * @throws {InternalServerErrorException} If an error occurs while posting the application.
   */
  @LogAndHandle()
  @Transactional()
  async postApplication(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    ResultWrapper
    try {
      const caseLookup = (
        await this.utilityService.caseLookupByApplicationId(applicationId)
      ).unwrap()

      const { application } = (
        await this.getApplication(applicationId)
      ).unwrap()

      this.caseService.updateCase({
        caseId: caseLookup.id,
        advertTitle: application.answers.advert.title,
        departmentId: application.answers.advert.departmentId,
        advertTypeId: application.answers.advert.typeId,
        requestedPublicationDate: application.answers.advert.requestedDate,
        message: application.answers.advert.message,
        categoryIds: application.answers.advert.categories,
      })

      const commStatus = (
        await this.utilityService.caseCommunicationStatusLookup(
          CaseCommunicationStatus.HasAnswers,
          transaction,
        )
      ).unwrap()

      ResultWrapper.unwrap(
        await this.caseService.updateCaseCommunicationStatus(
          caseLookup.id,
          {
            statusId: commStatus.id,
          },
          transaction,
        ),
      )

      ResultWrapper.unwrap(
        await this.commentService.createComment(caseLookup.id, {
          internal: true,
          type: CaseCommentType.Submit,
          comment: null,
          initiator: caseLookup.involvedPartyId,
          receiver: null,
        }),
      )

      return ResultWrapper.ok()
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 404) {
        ResultWrapper.unwrap(
          await this.caseService.createCase(
            {
              applicationId,
            },
            transaction,
          ),
        )

        return ResultWrapper.ok()
      }
    }

    throw new InternalServerErrorException(
      `Could not post application<${applicationId}>`,
    )
  }

  /**
   * Retrieves the comments of an application.
   * @param applicationId - The id of the application.
   * @returns A `ResultWrapper` containing the comments of the application.
   */
  @LogAndHandle()
  async getComments(
    applicationId: string,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>> {
    const caseResponse = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    const commentsResult = (
      await this.commentService.getComments(caseResponse.id, {
        internal: false,
      })
    ).unwrap()

    return ResultWrapper.ok({
      comments: commentsResult.comments,
    })
  }

  /**
   * Handles comment submissions from the application system.
   * @param applicationId - The id of the application.
   * @param commentBody - The body of the comment.
   * @returns A `ResultWrapper.ok()`.
   */
  @LogAndHandle()
  async postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<ResultWrapper> {
    const caseLookup = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    const involvedPartyId = caseLookup.involvedPartyId
      ? caseLookup.involvedPartyId
      : 'e5a35cf9-dc87-4da7-85a2-06eb5d43812f'

    ResultWrapper.unwrap(
      await this.commentService.createComment(caseLookup.id, {
        comment: commentBody.comment,
        initiator: involvedPartyId, // TODO: REPLACE WITH ACTUAL USER
        receiver: null,
        internal: false,
        type: CaseCommentType.Comment,
        storeState: true,
      }),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async uploadAttachments(
    applicationId: string,
    files: Array<Express.Multer.File>,
  ): Promise<ResultWrapper<S3UploadFilesResponse>> {
    ResultWrapper.unwrap(await this.getApplication(applicationId))

    const uploadedFiles = (
      await this.s3Service.uploadApplicationAttachments(applicationId, files)
    ).unwrap()

    return ResultWrapper.ok({
      files: uploadedFiles,
    })
  }

  @LogAndHandle()
  async getPresignedUrl(
    key: string,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    return this.s3Service.getPresignedUrl(key)
  }

  /**
   * Used to add an attachment to an application.
   * When an attachment is uploaded from the application system (with presigned url)
   * this method is called to store the attachment in the database.
   * @param applicationId id of the application
   * @param fileName name of the file ex. dummy
   * @param originalFileName original name of the file ex. dummy.pdf
   * @param fileFormat format of the file ex. pdf
   * @param fileExtension extension of the file ex. pdf
   * @param fileLocation the s3 url where the file is stored
   * @param fileSize size of the file in bytes
   * @param transaction
   * @returns
   */
  @LogAndHandle()
  @Transactional()
  async addApplicationAttachment(
    applicationId: string,
    type: AttachmentTypeParams,
    body: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    ResultWrapper.unwrap(
      await this.attachmentService.createAttachment(
        applicationId,
        type,
        body,
        transaction,
      ),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getApplicationAttachments(
    applicationId: string,
    type: AttachmentTypeParams,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>> {
    const attachments = (
      await this.attachmentService.getAttachments(applicationId, type)
    ).unwrap()

    return ResultWrapper.ok(attachments)
  }

  @LogAndHandle()
  @Transactional()
  async deleteApplicationAttachment(
    applicationId: string,
    key: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return await this.attachmentService.deleteAttachmentByKey(
      applicationId,
      key,
      transaction,
    )
  }
}
