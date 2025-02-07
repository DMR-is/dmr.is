import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { SignatureType } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { BaseEntity } from '@dmr.is/shared/dto'
import {
  AdditionType,
  Application,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CaseTagEnum,
  CreateCaseBody,
  CreateCaseChannelBody,
  PostApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { getFastTrack, getSignatureBody } from '@dmr.is/utils'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../../../application/application.service.interface'
import { IAttachmentService } from '../../../attachments/attachment.service.interface'
import { ICommentServiceV2 } from '../../../comment/v2'
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
  categories: BaseEntity[]
  channels: CreateCaseChannelBody[]
  additions: CreateAddtionBody[]
  signatureDate: string
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
    @Inject(ICommentServiceV2)
    private readonly commentService: ICommentServiceV2,
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
        application.answers.advert.type.id,
        transaction,
      ),
      this.utilityService.departmentLookup(
        application.answers.advert.department.id,
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

    const caseStatus = caseStatusResult.result.value
    const caseTag = caseTagResult.result.value
    const caseCommunicationStatus = caseCommunicationStatusResult.result.value
    const internalCaseNumber = internalCaseNumberResult.result.value
    const type = typeResult.result.value
    const department = departmentResult.result.value
    const requestedDate = application.answers.advert.requestedDate
    const { fastTrack } = getFastTrack(new Date(requestedDate))
    const involvedPartyId = application.answers.advert.involvedPartyId
    const message = application.answers.advert?.message ?? null

    const findLatestYear = (dateStrings: string[]) => {
      const dates = dateStrings.map((date) => new Date(date))
      return dates.reduce(
        (prev, current) => (prev > current ? prev : current),
        new Date(),
      )
    }

    const signatureDate =
      application.answers.misc.signatureType === SignatureType.Regular
        ? findLatestYear(
            application.answers.signatures.regular.map(
              (signature) => signature.date,
            ),
          )
        : new Date(application.answers.signatures.committee.date)

    const channels =
      application.answers.advert.channels?.map((channel) => {
        return {
          email: channel.email,
          phone: channel.phone,
        }
      }) ?? []

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
        year: signatureDate.getFullYear(),
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
      categories: application.answers.advert.categories,
      channels: channels,
      additions: additionsBody,
      signatureDate: signatureDate.toISOString(),
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
  async createCase(
    body: PostApplicationBody,
  ): Promise<ResultWrapper<{ id: string }>> {
    const { application } = (
      await this.applicationService.getApplication(body.applicationId)
    ).unwrap()

    const valuesResult = await this.getCreateCaseBody(application)

    if (!valuesResult.result.ok) {
      return ResultWrapper.err({ code: 500, message: 'Failed to create case' })
    }

    const values = valuesResult.result.value

    const createCaseResult = await this.create(values.caseBody)

    if (!createCaseResult.result.ok) {
      return createCaseResult
    }

    const caseId = createCaseResult.result.value.id

    await this.commentService.createSubmitComment(caseId, {
      institutionCreatorId: values.caseBody.involvedPartyId,
    })

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

    ResultWrapper.unwrap(
      await this.signatureService.createSignature(caseId, {
        involvedPartyId: values.caseBody.involvedPartyId,
        signatureDate: values.signatureDate,
        records:
          application.answers.misc.signatureType === SignatureType.Regular
            ? application.answers.signatures.regular.map((signature) => ({
                institution: signature.institution,
                signatureDate: signature.date,
                additional:
                  application.answers.signatures.additionalSignature?.regular,
                members: signature.members.map((member) => ({
                  name: member.name,
                  textAbove: member.above ?? null,
                  textBefore: member.before ?? null,
                  textAfter: member.after ?? null,
                  textBelow: member.below ?? null,
                })),
              }))
            : [
                {
                  institution:
                    application.answers.signatures.committee.institution,
                  signatureDate: application.answers.signatures.committee.date,
                  additional:
                    application.answers.signatures.additionalSignature
                      ?.committee,
                  members: application.answers.signatures.committee.members.map(
                    (member) => ({
                      name: member.name ?? null,
                      textAbove: member.above ?? null,
                      textBefore: member.before ?? null,
                      textAfter: member.after ?? null,
                      textBelow: member.below ?? null,
                    }),
                  ),
                },
              ],
      }),
    )

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
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to get attachments',
      })
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

    await Promise.all(
      values.additions.map((addition) =>
        this.createCaseAddition(caseId, addition.title, addition.content),
      ),
    )

    return ResultWrapper.ok({ id: caseId })
  }

  async createCaseAddition(
    caseId: string,
    title: string,
    content: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const additionId = uuid()

    try {
      await this.caseAdditionModel.create(
        {
          id: additionId,
          title,
          content,
          type: AdditionType.Html,
        },
        {
          transaction,
        },
      )

      await this.caseAdditionsModel.create(
        {
          caseId,
          additionId,
        },
        {
          transaction,
        },
      )

      return ResultWrapper.ok()
    } catch (error) {
      this.logger.error(`Failed to create addition for case<${caseId}>`, {
        category: LOGGING_CATEGORY,
        error,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create addition',
      })
    }
  }
}
