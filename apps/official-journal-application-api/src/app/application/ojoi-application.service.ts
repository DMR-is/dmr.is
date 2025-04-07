import { Transaction } from 'sequelize'
import { AttachmentTypeParam, SignatureType } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { applicationCaseMigrate } from '@dmr.is/official-journal/migrations/application/application-case.migrate'
import {
  CaseActionEnum,
  CaseCommunicationStatusEnum,
  CaseCommunicationStatusModel,
  CaseHistoryModel,
  CaseModel,
} from '@dmr.is/official-journal/models'
import {
  GetApplicationAttachmentsResponse,
  IAttachmentService,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import { ICommentService } from '@dmr.is/official-journal/modules/comment'
import { IPriceService } from '@dmr.is/official-journal/modules/price'
import { OJOIApplication } from '@dmr.is/shared/dto'
import { IApplicationService } from '@dmr.is/shared/modules/application'
import {
  IAWSService,
  PresignedUrlResponse,
  S3UploadFilesResponse,
} from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'
import { getFastTrack, getHtmlTextLength } from '@dmr.is/utils'

import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { ApplicationPriceResponse } from './dto/application-price-response.dto'
import {
  AdvertTemplateDetails,
  GetAdvertTemplateResponse,
} from './dto/get-advert-template-response.dto'
import {
  ApplicationAdvertItem,
  GetApplicationAdverts,
  GetApplicationAdvertsQuery,
} from './dto/get-application-advert.dto'
import { PostApplicationComment } from './dto/post-application-comment.dto'
import { IOfficialJournalApplicationService } from './ojoi-application.service.interface'
import { getTemplate, getTemplateDetails } from './utils'
const LOGGING_CATEGORY = 'official-journal-application-api-application-service'
const LOGGING_CONTEXT = 'OfficialJournalApplicationApiApplicationService'
import { GetApplicationCaseResponse } from '@dmr.is/official-journal/dto/application/application-case.dto'
import { AdvertTemplateType } from '@dmr.is/official-journal/dto/application/application-template-type.dto'
import { GetComments } from '@dmr.is/official-journal/dto/comment/comment.dto'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { IAdvertService } from '@dmr.is/official-journal/modules/advert'
import { ICaseService } from '@dmr.is/official-journal/modules/case'
import { ISignatureService } from '@dmr.is/official-journal/modules/signature'

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
    @Inject(ICaseService) private readonly caseService: ICaseService,
    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @InjectModel(CaseHistoryModel)
    private readonly casehistoryModel: typeof CaseHistoryModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseCommunicationStatusModel)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,
  ) {}

  private async createApplicationCase(
    application: OJOIApplication,
    currentUser: UserDto,
  ): Promise<ResultWrapper> {
    const caseCreateResults = ResultWrapper.unwrap(
      await this.caseService.createCase(
        {
          applicationId: application.id,
          departmentId: application.answers.advert.department.id,
          involvedPartyId: application.answers.advert.involvedPartyId,
          subject: application.answers.advert.title,
          typeId: application.answers.advert.type.id,
          requestedPublicationDate: application.answers.advert.requestedDate,
          message: application.answers.advert.message,
          html: application.answers.advert.html,
        },
        currentUser,
      ),
    )

    const signatureToUse =
      application.answers.misc?.signatureType || SignatureType.Committee

    const records = application.answers.signature[signatureToUse]?.records ?? []

    await Promise.all([
      this.signatureService.createSignature(caseCreateResults.id, {
        involvedPartyId: application.answers.advert.involvedPartyId,
        records: records.map((record) => ({
          institution: record.institution,
          signatureDate: record.signatureDate,
          additional: record.additional,
          chairman: record.chairman
            ? {
                name: record.chairman.name,
                textAbove: record.chairman.above ?? null,
                textAfter: record.chairman.after ?? null,
                textBelow: record.chairman.below ?? null,
                textBefore: null,
              }
            : undefined,
          members: record.members.map((member) => ({
            name: member.name,
            textAbove: member.above ?? null,
            textAfter: member.after ?? null,
            textBelow: member.below ?? null,
            textBefore: null,
          })),
        })),
      }),

      this.commentService.createSubmitComment(caseCreateResults.id, {
        institutionCreatorId: application.answers.advert.involvedPartyId,
      }),

      this.casehistoryModel.createHistoryByCaseId(caseCreateResults.id),
    ])

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
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
    const { adverts, paging } = ResultWrapper.unwrap(
      await this.advertService.getAdverts({
        search: query.search,
        page: query.page,
        pageSize: query.pageSize,
      }),
    )

    const applicationAdverts: ApplicationAdvertItem[] = adverts.map(
      (advert) => ({
        id: advert.id,
        title: advert.title,
        type: advert.type,
        department: advert.department,
        involvedParty: advert.involvedParty,
        categories: advert.categories,
        html: advert.document.html ?? '', // Provide a fallback empty string if html is null
        mainType: null,
      }),
    )

    return ResultWrapper.ok({
      adverts: applicationAdverts,
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
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    ResultWrapper
    const caseLookup = await this.caseModel.findOne({
      attributes: ['id', 'applicationId'],
      where: {
        applicationId,
      },
    })

    const { application }: { application: OJOIApplication } =
      ResultWrapper.unwrap(
        await this.applicationService.getApplication(applicationId),
      )

    // if users unexpectedly has his involved party removed we need to check here
    const canPost = currentUser.involvedParties.some(
      (ip) => ip.id === application.answers.advert.involvedPartyId,
    )

    if (!canPost) {
      this.logger.warn(
        `User tried to post application from the application system for an institution that he does not have access to`,
        {
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
          userId: currentUser.id,
          applicationId: application.id,
          userInvolvedParties: currentUser.involvedParties,
          involvedPartyId: application.answers.advert.involvedPartyId,
        },
      )
      throw new ForbiddenException()
    }

    // No case exists for the application, create a new one
    if (!caseLookup) {
      ResultWrapper.unwrap(
        await this.createApplicationCase(application, currentUser),
      )

      return ResultWrapper.ok()
    }

    // Case exists so we update
    const commStatusTest = await this.caseCommunicationStatusModel.findByTitle(
      CaseCommunicationStatusEnum.HasAnswers,
    )

    ResultWrapper.unwrap(
      await this.caseService.updateCase(
        caseLookup.id,
        {
          subject: application.answers.advert.title,
          departmentId: application.answers.advert.department.id,
          typeId: application.answers.advert.type.id,
          requestedPublicationDate: application.answers.advert.requestedDate,
          html: application.answers.advert.html,
          categoryIds: application.answers.advert.categories.map(
            (cat) => cat.id,
          ),
          communicationStatusId: commStatusTest?.id,
        },
        currentUser,
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

    await this.casehistoryModel.createHistoryByCaseId(caseLookup.id)

    return ResultWrapper.ok()
  }
}
