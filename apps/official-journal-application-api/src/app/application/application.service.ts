import { Op, Transaction } from 'sequelize'
import { AttachmentTypeParam } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvertTemplateType, UserDto } from '@dmr.is/official-journal/dto'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertMainTypeModel,
  AdvertModel,
  AdvertTypeModel,
  CaseActionEnum,
  CaseCommunicationStatusEnum,
  CaseCommunicationStatusModel,
  CaseModel,
} from '@dmr.is/official-journal/models'
import {
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  IAttachmentService,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import {
  GetComments,
  ICommentService,
} from '@dmr.is/official-journal/modules/comment'
import { IPriceService } from '@dmr.is/official-journal/modules/price'
import { OJOIApplication } from '@dmr.is/shared/dto'
import { IApplicationService } from '@dmr.is/shared/modules/application'
import {
  IAWSService,
  PresignedUrlResponse,
  S3UploadFilesResponse,
} from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'
import {
  generatePaging,
  getFastTrack,
  getHtmlTextLength,
  getLimitAndOffset,
} from '@dmr.is/utils'

import { HttpException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { ApplicationPriceResponse } from './dto/application-price-response.dto'
import {
  AdvertTemplateDetails,
  GetAdvertTemplateResponse,
} from './dto/get-advert-template-response.dto'
import {
  GetApplicationAdverts,
  GetApplicationAdvertsQuery,
} from './dto/get-application-advert.dto'
import { PostApplicationComment } from './dto/post-application-comment.dto'
import { applicationAdvertMigrate } from './migrations/application-advert.migrate'
import { applicationCaseMigrate } from './migrations/application-case.migrate'
import { IOfficialJournalApplicationService } from './application.service.interface'
import { getTemplate, getTemplateDetails } from './utils'

const LOGGING_CATEGORY = 'official-journal-application-api-application-service'
const LOGGING_CONTEXT = 'OfficialJournalApplicationApiApplicationService'

@Injectable()
export class OfficialJournalApplicationService
  implements IOfficialJournalApplicationService
{
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IPriceService) private readonly priceService: IPriceService,
    @Inject(ICommentService) private readonly commentService: ICommentService,
    @Inject(IAWSService) private readonly s3Service: IAWSService,
    @Inject(IAttachmentService)
    private readonly attachmentService: IAttachmentService,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(CaseCommunicationStatusModel)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  async getApplicationCase(
    applicationId: string,
  ): Promise<ResultWrapper<GetApplicationCaseResponse>> {
    const caseLookup = await this.caseModel.findOne({
      where: {
        applicationId,
      },
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const migrated = applicationCaseMigrate(caseLookup)

    return ResultWrapper.ok({
      applicationCase: migrated,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getPrice(
    applicationId: string,
  ): Promise<ResultWrapper<ApplicationPriceResponse>> {
    const { application }: { application: OJOIApplication } =
      ResultWrapper.unwrap(
        await this.applicationService.getApplication(applicationId),
      )

    const isFastTrack = getFastTrack(
      new Date(application.answers.advert.requestedDate),
    ).fastTrack

    const { price } = ResultWrapper.unwrap(
      await this.priceService.getPriceByDepartmentSlug({
        slug: application.answers.advert.department.slug,
        bodyLengthCount: getHtmlTextLength(application.answers?.advert.html),
        isFastTrack,
      }),
    )

    if (!price) {
      return ResultWrapper.err({
        code: 500,
        message: 'Could not get price',
      })
    }
    return ResultWrapper.ok({
      price: price,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getApplicationAdvertTemplates(): Promise<
    ResultWrapper<AdvertTemplateDetails[]>
  > {
    const res = getTemplateDetails()

    return ResultWrapper.ok(res)
  }

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
    const caseLookup = await this.caseModel.findOne({
      attributes: ['id', 'applicationId'],
      where: {
        applicationId,
      },
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const comments = ResultWrapper.unwrap(
      await this.commentService.getComments(caseLookup.id, {
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
    userDto: UserDto,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findOne({
      attributes: ['id', 'applicationId'],
      where: {
        applicationId,
      },
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    ResultWrapper.unwrap(
      await this.commentService.createApplicationComment(caseLookup.id, {
        applicationUserCreatorId: userDto.id,
        comment: body.comment,
      }),
    )

    const commStatus = await this.caseCommunicationStatusModel.findOne({
      where: {
        title: CaseCommunicationStatusEnum.HasAnswers,
      },
    })

    if (!commStatus) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case communication status not found',
      })
    }

    await caseLookup.update({
      communicationStatusId: commStatus.id,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async uploadAttachments(
    applicationId: string,
    files: Array<Express.Multer.File>,
  ): Promise<ResultWrapper<S3UploadFilesResponse>> {
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
    const caseLookup = await this.caseModel.findOne({
      attributes: ['id', 'applicationId'],
      where: {
        applicationId,
      },
    })
    if (caseLookup) {
      caseId = caseLookup.id
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
        context: LOGGING_CONTEXT,
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
      const caseLookup = await this.caseModel.findOne({
        where: {
          applicationId,
        },
      })

      const { application }: { application: OJOIApplication } =
        ResultWrapper.unwrap(
          await this.applicationService.getApplication(applicationId),
        )

      // first time submitting the application so we create a case
      if (!caseLookup) {
        return await this.caseService.createCaseByApplication({
          applicationId,
        })
      }

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
          CaseCommunicationStatusEnum.HasAnswers,
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
}
