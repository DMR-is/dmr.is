import { Op, Transaction } from 'sequelize'
import { AttachmentTypeParam } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertMainTypeModel,
  AdvertModel,
  AdvertTypeModel,
  CaseActionEnum,
  CaseCommunicationStatusEnum,
} from '@dmr.is/official-journal/models'
import {
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  IAttachmentService,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import {
  CasePriceResponse,
  ICaseService,
} from '@dmr.is/official-journal/modules/case'
import {
  GetComments,
  ICommentService,
} from '@dmr.is/official-journal/modules/comment'
import {
  AdvertTemplateDetails,
  AdvertTemplateType,
  GetAdvertTemplateResponse,
} from '@dmr.is/official-journal/modules/journal'
import { IPriceService } from '@dmr.is/official-journal/modules/price'
import { UserDto } from '@dmr.is/official-journal/modules/user'
import { IUtilityService } from '@dmr.is/official-journal/modules/utility'
import { IApplicationService } from '@dmr.is/shared/modules/application'
import {
  IAWSService,
  PresignedUrlResponse,
  S3UploadFilesResponse,
} from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { HttpException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Application } from './dto/application.dto'
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
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @Inject(IPriceService) private readonly priceService: IPriceService,
    @Inject(ICommentService) private readonly commentService: ICommentService,
    @Inject(ICaseService) private readonly caseService: ICaseService,
    @Inject(IAWSService) private readonly s3Service: IAWSService,
    @Inject(IAttachmentService)
    private readonly attachmentService: IAttachmentService,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

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
  @Transactional()
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
    userDto: UserDto,
  ): Promise<ResultWrapper> {
    const caseLookup = (
      await this.utilityService.caseLookupByApplicationId(applicationId)
    ).unwrap()

    ResultWrapper.unwrap(
      await this.commentService.createApplicationComment(caseLookup.id, {
        applicationUserCreatorId: userDto.id,
        comment: body.comment,
      }),
    )

    await this.caseService.updateCaseCommunicationStatusByStatus(
      caseLookup.id,
      CaseCommunicationStatusEnum.HasAnswers,
    )

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
        context: LOGGING_CONTEXT,
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
      const caseLookup = (
        await this.utilityService.caseLookupByApplicationId(
          applicationId,
          transaction,
        )
      ).unwrap()

      const application = (await this.applicationService.getApplication(
        applicationId,
      )) as Application

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
