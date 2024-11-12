import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Application,
  CaseCommentSourceEnum,
  CaseCommentTypeTitleEnum,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CaseTagEnum,
  CreateCaseBody,
  CreateCaseChannelBody,
  CreateSignatureBody,
  PostApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { getFastTrack, getSignatureBody } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../../../application/application.service.interface'
import { IAttachmentService } from '../../../attachments/attachment.service.interface'
import { ICommentService } from '../../../comment/comment.service.interface'
import { AdvertCategoryModel } from '../../../journal/models'
import { ISignatureService } from '../../../signature/signature.service.interface'
import { IUtilityService } from '../../../utility/utility.module'
import {
  CaseAdditionModel,
  CaseAdditionsModel,
  CaseCategoriesModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseModel,
} from '../../models'
import { ICaseCreateService } from './case-create.service.interface'

const LOGGING_CATEGORY = 'CaseCreateService'

type CreateAddtionBody = {
  id: string
  title: string
  content: string
}

interface CreateCaseBodyValues {
  caseBody: {
    id: string
    applicationId: string
    statusId: string
    tagId: string
    communicationStatusId: string
    involvedPartyId: string
    departmentId: string
    advertTypeId: string
    year: number
    caseNumber: string
    advertTitle: string
    html: string
    requestedPublicationDate: string
    assignedUserId: string | null
    publishedAt: string | null
    price: number
    paid: boolean
    fastTrack: boolean
    message: string | null
    isLegacy: boolean
    createdAt: string
    updatedAt: string
  }
  categories: AdvertCategoryModel[]
  channels: CreateCaseChannelBody[]
  signature: CreateSignatureBody[]
  additions: CreateAddtionBody[]
}

@Injectable()
export class CaseCreateService implements ICaseCreateService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IAttachmentService)
    private readonly attachmentService: IAttachmentService,
    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
    @Inject(ICommentService) private readonly commentService: ICommentService,
    @InjectModel(CaseChannelModel)
    private readonly caseChannelModel: typeof CaseChannelModel,
    @InjectModel(CaseChannelsModel)
    private readonly caseChannelsModel: typeof CaseChannelsModel,

    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,

    @InjectModel(CaseCategoriesModel)
    private readonly caseCategoriesModel: typeof CaseCategoriesModel,

    @InjectModel(CaseAdditionModel)
    private readonly caseAdditionModel: typeof CaseAdditionModel,
    @InjectModel(CaseAdditionsModel)
    private readonly caseAdditionsModel: typeof CaseAdditionsModel,

    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  private async getCreateCaseBody(
    application: Application,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseBodyValues>> {
    const now = new Date()
    const caseId = uuid()

    const promises = await Promise.all([
      this.utilityService.caseStatusLookup(
        CaseStatusEnum.Submitted,
        transaction,
      ),
      this.utilityService.caseTagLookup(CaseTagEnum.NotStarted, transaction),
      this.utilityService.caseCommunicationStatusLookup(
        CaseCommunicationStatus.NotStarted,
        transaction,
      ),
      this.utilityService.generateInternalCaseNumber(transaction),
      this.utilityService.typeLookup(
        application.answers.advert.typeId,
        transaction,
      ),
      this.utilityService.departmentLookup(
        application.answers.advert.departmentId,
        transaction,
      ),
      this.utilityService.categoriesLookup(
        application.answers.advert.categories,
        transaction,
      ),
    ])

    const [
      caseStatusResult,
      caseTagResult,
      caseCommunicationStatusResult,
      internalCaseNumberResult,
      typeResult,
      departmentResult,
      categoriesResult,
    ] = promises

    if (!caseStatusResult.result.ok) {
      return ResultWrapper.err({
        code: caseStatusResult.result.error.code,
        message: caseStatusResult.result.error.message,
      })
    }

    if (!caseTagResult.result.ok) {
      return ResultWrapper.err({
        code: caseTagResult.result.error.code,
        message: caseTagResult.result.error.message,
      })
    }

    if (!caseCommunicationStatusResult.result.ok) {
      return ResultWrapper.err({
        code: caseCommunicationStatusResult.result.error.code,
        message: caseCommunicationStatusResult.result.error.message,
      })
    }

    if (!internalCaseNumberResult.result.ok) {
      return ResultWrapper.err({
        code: internalCaseNumberResult.result.error.code,
        message: internalCaseNumberResult.result.error.message,
      })
    }

    if (!typeResult.result.ok) {
      return ResultWrapper.err({
        code: typeResult.result.error.code,
        message: typeResult.result.error.message,
      })
    }

    if (!departmentResult.result.ok) {
      return ResultWrapper.err({
        code: departmentResult.result.error.code,
        message: departmentResult.result.error.message,
      })
    }

    if (!categoriesResult.result.ok) {
      return ResultWrapper.err({
        code: categoriesResult.result.error.code,
        message: categoriesResult.result.error.message,
      })
    }

    const caseStatus = caseStatusResult.result.value
    const caseTag = caseTagResult.result.value
    const caseCommunicationStatus = caseCommunicationStatusResult.result.value
    const internalCaseNumber = internalCaseNumberResult.result.value
    const type = typeResult.result.value
    const department = departmentResult.result.value
    const categories = categoriesResult.result.value

    const channels =
      application.answers.advert.channels?.map((channel) => {
        return {
          email: channel.email,
          phone: channel.phone,
        }
      }) ?? []

    const signatureType = application.answers.misc.signatureType
    const signature = application.answers.signatures[signatureType]

    const additionalSignature =
      application.answers.signatures.additionalSignature !== undefined
        ? application.answers.signatures.additionalSignature[signatureType]
        : undefined

    const signatureBody = Array.isArray(signature)
      ? signature.map((signature) =>
          getSignatureBody(caseId, signature, additionalSignature),
        )
      : [getSignatureBody(caseId, signature, additionalSignature)]

    const requestedDate = application.answers.advert.requestedDate
    const { fastTrack } = getFastTrack(new Date(requestedDate))
    const involvedPartyId = application.answers.advert.involvedPartyId
    const message = application.answers.advert?.message ?? null

    const additions = (application.answers.advert.additions?.filter(
      (addition) => addition.content !== undefined,
    ) ?? []) as CreateAddtionBody[]

    const additionsBody = additions.map((addition) => {
      return {
        id: addition.id,
        title: addition.title,
        content: addition.content,
      }
    })

    return ResultWrapper.ok({
      caseBody: {
        id: caseId,
        applicationId: application.id,
        statusId: caseStatus.id,
        tagId: caseTag.id,
        communicationStatusId: caseCommunicationStatus.id,
        involvedPartyId: involvedPartyId,
        departmentId: department.id,
        advertTypeId: type.id,
        year: now.getFullYear(),
        caseNumber: internalCaseNumber.internalCaseNumber,
        advertTitle: application.answers.advert.title,
        html: application.answers.advert.html,
        requestedPublicationDate: requestedDate,
        assignedUserId: null,
        publishedAt: null,
        price: 0,
        paid: false,
        fastTrack: fastTrack,
        message: message ?? null,
        isLegacy: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      categories: categories,
      channels: channels,
      signature: signatureBody,
      additions: additionsBody,
    })
  }

  @LogAndHandle()
  @Transactional()
  private async create(
    body: CreateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ id: string }>> {
    const newCase = await this.caseModel.create(
      {
        ...body,
      },
      {
        returning: ['id'],
        transaction: transaction,
      },
    )
    return ResultWrapper.ok({ id: newCase.id })
  }

  @LogAndHandle()
  @Transactional()
  async createCaseCategory(
    caseId: string,
    categoryId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseCategoriesModel.create(
      {
        caseId,
        categoryId,
      },
      {
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const channel = await this.caseChannelModel.create(
      {
        email: body.email,
        phone: body.phone,
      },
      {
        returning: ['id'],
        transaction,
      },
    )

    await this.caseChannelsModel.create(
      {
        caseId,
        channelId: channel.id,
      },
      {
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async createCase(body: PostApplicationBody): Promise<ResultWrapper> {
    const { application } = (
      await this.applicationService.getApplication(body.applicationId)
    ).unwrap()

    const valuesResult = await this.getCreateCaseBody(application)

    if (!valuesResult.result.ok) {
      return valuesResult
    }

    const values = valuesResult.result.value

    const createCaseResult = await this.create(values.caseBody)

    if (!createCaseResult.result.ok) {
      return createCaseResult
    }

    const caseId = createCaseResult.result.value.id

    const institution = (
      await this.utilityService.institutionLookup(
        values.caseBody.involvedPartyId,
      )
    ).unwrap()

    const commentResults = await this.commentService.createComment(caseId, {
      internal: true,
      type: CaseCommentTypeTitleEnum.Submit,
      creator: institution.title,
      source: CaseCommentSourceEnum.Application,
      comment: null,
      receiver: null,
      storeState: true,
    })

    if (!commentResults.result.ok) {
      this.logger.warn(`Failed to create comment for case<${caseId}>`, {
        error: commentResults.result.error,
        category: LOGGING_CATEGORY,
        caseId: caseId,
      })
    }

    const categegoryPromises = await Promise.all(
      values.categories.map((cat) => this.createCaseCategory(caseId, cat.id)),
    )

    categegoryPromises.forEach((result) => {
      if (!result.result.ok) {
        this.logger.warn(
          `Failed to create category when creating case<${caseId}>`,
          result.result.error,
        )
      }
    })

    if (values.channels.length > 0) {
      const channelPromises = await Promise.all(
        values.channels.map((channel) =>
          this.createCaseChannel(caseId, channel),
        ),
      )

      channelPromises.forEach((result) => {
        if (!result.result.ok) {
          this.logger.warn(`Failed to create channel for case<${caseId}>`, {
            error: result.result.error,
            category: LOGGING_CATEGORY,
            caseId: caseId,
          })
        }
      })
    }

    const signaturePromises = await Promise.all(
      values.signature.map((signatureBody) =>
        this.signatureService.createCaseSignature(signatureBody),
      ),
    )

    signaturePromises.forEach((result) => {
      if (!result.result.ok) {
        this.logger.warn(`Failed to create signature for case<${caseId}>`, {
          error: result.result.error,
          category: LOGGING_CATEGORY,
          caseId: caseId,
        })
      }
    })

    const attachmentsLookup = await this.attachmentService.getAllAttachments(
      application.id,
    )

    if (!attachmentsLookup.result.ok) {
      this.logger.warn(
        `Failed to get attachments for application<${application.id}>`,
        {
          error: attachmentsLookup.result.error,
          category: LOGGING_CATEGORY,
          applicationId: application.id,
        },
      )
      return attachmentsLookup
    }

    const attachments = attachmentsLookup.result.value.attachments

    const attachmentPromises = await Promise.all(
      attachments.map((attachment) =>
        this.attachmentService.createCaseAttachment(caseId, attachment.id),
      ),
    )

    attachmentPromises.forEach((result) => {
      if (!result.result.ok) {
        this.logger.warn(`Failed to create attachment for case<${caseId}>`, {
          error: result.result.error,
          category: LOGGING_CATEGORY,
          caseId: caseId,
        })
      }
    })

    if (values.additions.length > 0) {
      await Promise.all(
        values.additions.map((addition) =>
          this.caseAdditionModel.create({
            id: addition.id,
            title: addition.title,
            content: addition.content,
            type: 'html',
          }),
        ),
      )

      await Promise.all(
        values.additions.map((addition) =>
          this.caseAdditionsModel.create({
            caseId,
            additionId: addition.id,
          }),
        ),
      )
    }

    return ResultWrapper.ok()
  }
}
