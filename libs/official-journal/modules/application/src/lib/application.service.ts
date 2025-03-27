import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { ApplicationEvent, AttachmentTypeParam } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { applicationAdvertMigrate } from './migrations/application-advert.migrate'
import { IApplicationService } from './application.service.interface'
import {
  AdvertModel,
  AdvertDepartmentModel,
  AdvertCategoryModel,
} from '@dmr.is/official-journal/models'
import {
  AdvertTemplateDetails,
  AdvertTemplateType,
  GetAdvertTemplateResponse,
} from '@dmr.is/official-journal/modules/journal'
import { Application } from 'express'
import { getTemplateDetails, getTemplate } from './application.utils'
import {
  GetApplicationAdvertsQuery,
  GetApplicationAdverts,
} from './dto/get-application-advert.dto'
import { GetApplicationResponse } from './dto/get-application-response.dto'
import { PostApplicationComment } from './dto/post-application-comment.dto'
import { UpdateApplicationBody } from './dto/updateApplication-body.dto'
import { GetApplicationCaseResponse } from '@dmr.is/official-journal/modules/attachment'
import { CasePriceResponse } from '@dmr.is/official-journal/modules/case'

const LOGGING_CATEGORY = 'application-service'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAttachmentService)
    private readonly attachmentService: IAttachmentService,
    @Inject(forwardRef(() => IUtilityService))
    private readonly utilityService: IUtilityService,
    @Inject(forwardRef(() => ICommentServiceV2))
    private readonly commentService: ICommentServiceV2,
    @Inject(forwardRef(() => ICaseService))
    private readonly caseService: ICaseService,
    @Inject(IAuthService)
    private readonly authService: IAuthService,
    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
    @Inject(IPriceService)
    private readonly priceService: IPriceService,
    @Inject(IAWSService)
    private readonly s3Service: IAWSService,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using ApplicationService')
  }
  async getApplicationCase(
    applicationId: string,
  ): Promise<ResultWrapper<GetApplicationCaseResponse>> {
    const caseLookup =
      await this.utilityService.caseLookupByApplicationId(applicationId)

    if (!caseLookup.result.ok) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const migrated = applicationCaseMigrate(caseLookup.result.value)

    return ResultWrapper.ok({
      applicationCase: migrated,
    })
  }

  @LogAndHandle()
  async getPrice(
    applicationId: string,
  ): Promise<ResultWrapper<CasePriceResponse>> {
    try {
      return await this.priceService.getFeeByApplication(applicationId)
    } catch (error) {
      return ResultWrapper.err({
        code: 500,
        message: `Fee calculation failed on application<${applicationId}>. ${error}`,
      })
    }
  }

  @LogAndHandle()
  async getApplication(
    id: string,
  ): Promise<ResultWrapper<GetApplicationResponse>> {
    const res = await this.authService.xroadFetch(
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
    const res = await this.authService.xroadFetch(
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
    const res = await this.authService.xroadFetch(
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
        await this.utilityService.caseLookupByApplicationId(
          applicationId,
          transaction,
        )
      ).unwrap()

      const { application } = ResultWrapper.unwrap(
        await this.getApplication(applicationId),
      )

      // const { signatures } = ResultWrapper.unwrap(
      //   await this.signatureService.getSignaturesByCaseId(
      //     caseLookup.id,
      //     undefined,
      //     transaction,
      //   ),
      // )

      // Promise.all(
      //   signatures.map(async (signature) => {
      //     this.signatureService.deleteSignature(signature.id, transaction)
      //   }),
      // )

      // const signatureArray = signatureMapper(
      //   application.answers.signatures,
      //   application.answers.misc.signatureType,
      //   caseLookup.id,
      //   caseLookup.involvedPartyId,
      // )
      // Promise.all(
      //   signatureArray.map(async (signature) => {
      //     await this.signatureService.createCaseSignature(
      //       signature,
      //       transaction,
      //     )
      //   }),
      // )

      ResultWrapper.unwrap(
        await this.caseService.updateCase(
          {
            caseId: caseLookup.id,
            applicationId: applicationId,
            advertTitle: application.answers.advert.title,
            departmentId: application.answers.advert.department.id,
            advertTypeId: application.answers.advert.type.id,
            requestedPublicationDate: application.answers.advert.requestedDate,
            message: application.answers.advert.message,
            categoryIds: application.answers.advert.categories.map((c) => c.id),
          },
          transaction,
        ),
      )

      const commStatus = ResultWrapper.unwrap(
        await this.utilityService.caseCommunicationStatusLookup(
          CaseCommunicationStatus.HasAnswers,
          transaction,
        ),
      )

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
        await this.commentService.createSubmitComment(
          caseLookup.id,
          {
            institutionCreatorId: caseLookup.involvedParty.id,
          },
          transaction,
        ),
      )

      ResultWrapper.unwrap(
        await this.caseService.createCaseHistory(caseLookup.id, transaction),
      )

      return ResultWrapper.ok()
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 404) {
        return await this.caseService.createCaseByApplication({
          applicationId,
        })
      }
    }

    return ResultWrapper.err({
      code: 500,
      message: 'Could not post application',
    })
  }

  /**
   * Returns list of available advert template types.
   *
   * @returns A `ResultWrapper` containing an array of available types.
   */
  @LogAndHandle()
  @Transactional()
  async getApplicationAdvertTemplates(): Promise<
    ResultWrapper<AdvertTemplateDetails[]>
  > {
    const res = getTemplateDetails()

    return ResultWrapper.ok(res)
  }

  /**
   * Creates an advert template.
   * If no available value is provided for type, it will return 'AUGLÝSING' as default.
   *
   * @param type - The type of advert requested.
   * @returns A `ResultWrapper` containing the result of the operation.
   */
  @LogAndHandle()
  @Transactional()
  async getApplicationAdvertTemplate(
    input: AdvertTemplateType,
  ): Promise<ResultWrapper<GetAdvertTemplateResponse>> {
    const res = getTemplate(input.type)

    return ResultWrapper.ok(res)
  }

  /**
   * Retrieves the comments of an application.
   * @param applicationId - The id of the application.
   * @returns A `ResultWrapper` containing the comments of the application.
   */
  @LogAndHandle()
  async getComments(
    applicationId: string,
  ): Promise<ResultWrapper<GetComments>> {
    const caseResponse = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    const comments = ResultWrapper.unwrap(
      await this.commentService.getComments(caseResponse.id, {
        action: [
          CaseActionEnum.COMMENT_APPLICATION,
          CaseActionEnum.COMMENT_EXTERNAL,
        ],
      }),
    )

    return ResultWrapper.ok(comments)
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
    body: PostApplicationComment,
    UserDto: UserDto,
  ): Promise<ResultWrapper> {
    const caseLookup = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    ResultWrapper.unwrap(
      await this.commentService.createApplicationComment(caseLookup.id, {
        applicationUserCreatorId: UserDto.id,
        comment: body.comment,
      }),
    )

    await this.caseService.updateCaseCommunicationStatusByStatus(
      caseLookup.id,
      CaseCommunicationStatus.HasAnswers,
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
    const urlRes = ResultWrapper.unwrap(
      await this.s3Service.getPresignedUrl(key),
    )
    return ResultWrapper.ok({
      url: urlRes.url,
      cdn: process.env.ADVERTS_CDN_URL,
      key,
    })
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
    type: AttachmentTypeParam,
    body: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    let caseId: string | null = null
    try {
      const caseLookup =
        await this.utilityService.caseLookupByApplicationId(applicationId)

      if (caseLookup.result.ok) {
        caseId = caseLookup.result.value.id
      }
    } catch (e) {
      // Display a warning when no case is found.
      // This is not an error, as the case might not exist yet, and that's perfectly fine.
      // No transactional rollback is needed.
      this.logger.warn('Could not find case for application', {
        category: LOGGING_CATEGORY,
        error: e,
      })
    }

    const applicationAttachmentCreation =
      await this.attachmentService.createAttachment({
        params: {
          applicationId: applicationId,
          attachmentType: type,
          body: body,
        },
        transaction,
      })

    if (!applicationAttachmentCreation.result.ok) {
      this.logger.error('Could not create attachment', {
        category: LOGGING_CATEGORY,
        error: applicationAttachmentCreation.result.error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Could not create attachment',
      })
    }

    if (caseId) {
      await this.attachmentService.createCaseAttachment(
        caseId,
        applicationAttachmentCreation.result.value.id,
        transaction,
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getApplicationAttachments(
    applicationId: string,
    type: AttachmentTypeParam,
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

  @LogAndHandle()
  @Transactional()
  async getApplicationAdverts(
    query: GetApplicationAdvertsQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAdverts>> {
    const { limit, offset } = getLimitAndOffset({
      page: query?.page,
      pageSize: query?.pageSize,
    })

    const whereClause = {}

    if (query?.search) {
      Object.assign(whereClause, {
        [Op.or]: [
          {
            subject: {
              [Op.iLike]: `%${query.search}%`,
            },
          },
        ],
      })
    }

    const adverts = await this.advertModel.findAndCountAll({
      distinct: true,
      limit,
      offset,
      attributes: [
        'id',
        'subject',
        'documentHtml',
        'publicationYear',
        'serialNumber',
      ],
      where: whereClause,
      include: [
        {
          model: AdvertDepartmentModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: AdvertTypeModel,
          attributes: ['id', 'title', 'slug'],
          include: [
            {
              model: AdvertMainTypeModel,
              attributes: ['id', 'title', 'slug'],
              required: false,
            },
          ],
        },
        {
          model: AdvertCategoryModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
      order: [
        ['publicationYear', 'DESC'],
        ['serialNumber', 'DESC'],
      ],
      transaction,
    })

    const migrated = adverts.rows.map((advert) =>
      applicationAdvertMigrate(advert),
    )

    const paging = generatePaging(migrated, offset + 1, limit, adverts.count)

    return ResultWrapper.ok({
      adverts: migrated,
      paging,
    })
  }
}
