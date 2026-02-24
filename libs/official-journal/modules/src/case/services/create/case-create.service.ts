import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { SignatureType } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Advert,
  BaseEntity,
  CaseChannel,
  CreateCaseDto,
  CreateCaseResponseDto,
  UserDto,
} from '@dmr.is/shared-dto'
import {
  AdditionType,
  Application,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CaseTagEnum,
  CreateCaseBody,
  CreateCaseChannelBody,
  PostApplicationBody,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'
import { getFastTrack } from '@dmr.is/utils-server/serverUtils'

import { IApplicationService } from '../../../application/application.service.interface'
import { IAttachmentService } from '../../../attachments/attachment.service.interface'
import { ICommentServiceV2 } from '../../../comment/v2'
import { IPriceService } from '../../../price/price.service.interface'
import { ISignatureService } from '../../../signature/signature.service.interface'
import { IUtilityService } from '../../../utility/utility.module'
import { caseChannelMigrate } from '../../migrations/case-channel.migrate'
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

    @Inject(IPriceService)
    private readonly priceService: IPriceService,

    @InjectModel(CaseAdditionModel)
    private readonly caseAdditionModel: typeof CaseAdditionModel,
    @InjectModel(CaseAdditionsModel)
    private readonly caseAdditionsModel: typeof CaseAdditionsModel,

    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  async createCase(
    currentUser: UserDto,
    body: CreateCaseDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponseDto>> {
    const now = new Date()
    const nowIso = now.toISOString()

    const nextWeekdayAfterTenDays = (date: Date) => {
      const result = new Date(date)
      result.setDate(date.getDate() + 10)
      while (result.getDay() === 0 || result.getDay() === 6) {
        result.setDate(result.getDate() + 1)
      }
      return result
    }

    const caseNumberPromise =
      this.utilityService.generateInternalCaseNumber(transaction)

    const statusPromise = this.utilityService.caseStatusLookup(
      CaseStatusEnum.Submitted,
      transaction,
    )

    const communicationStatusPromise =
      this.utilityService.caseCommunicationStatusLookup(
        CaseCommunicationStatus.NotStarted,
        transaction,
      )

    const caseTagPromise = this.utilityService.caseTagLookup(
      CaseTagEnum.NotStarted,
      transaction,
    )

    const [
      caseNumberResult,
      statusResult,
      communicationStatusResult,
      caseTagResult,
    ] = await Promise.all([
      caseNumberPromise,
      statusPromise,
      communicationStatusPromise,
      caseTagPromise,
    ])

    const caseNumber = ResultWrapper.unwrap(caseNumberResult)
    const status = ResultWrapper.unwrap(statusResult)
    const communicationStatus = ResultWrapper.unwrap(communicationStatusResult)
    const caseTag = ResultWrapper.unwrap(caseTagResult)

    const createResults = await this.caseModel.create(
      {
        involvedPartyId: body.involvedPartyId,
        departmentId: body.departmentId,
        applicationId: body.applicationId,
        year: now.getFullYear(),
        statusId: status.id,
        tagId: caseTag.id,
        assignedUserId: currentUser.id,
        communicationStatusId: communicationStatus.id,
        caseNumber: caseNumber.internalCaseNumber,
        advertTypeId: body.typeId,
        advertTitle: body.subject,
        html: '<h3 class="article__title">1. gr.</h3>',
        requestedPublicationDate: nextWeekdayAfterTenDays(now).toISOString(),
        createdAt: nowIso,
        updatedAt: nowIso,
        isLegacy: false,
        fastTrack: false,
        proposedAdvertId: uuid(),
      },
      {
        transaction: transaction,
        returning: ['id'],
      },
    )
    await this.signatureService.createSignature(
      createResults.id,
      {
        involvedPartyId: body.involvedPartyId,
        records: [],
      },
      transaction,
    )

    await this.commentService.createSubmitComment(
      createResults.id,
      {
        institutionCreatorId: body.involvedPartyId,
      },
      transaction,
    )

    try {
      await this.priceService.updateCasePriceByCaseId(createResults.id, {})
    } catch (error) {
      // noop
      this.logger.error(
        `Failed to post external payment for case<${createResults.id}>`,
        {
          error,
          category: LOGGING_CATEGORY,
          caseId: createResults.id,
        },
      )
    }

    return ResultWrapper.ok({ id: createResults.id })
  }

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

    const signatureType =
      application.answers.misc?.signatureType === SignatureType.Committee
        ? SignatureType.Committee
        : SignatureType.Regular

    const signatureDate =
      signatureType === SignatureType.Regular
        ? findLatestYear(
            application.answers.signature?.regular?.records?.map(
              (signature) => signature.signatureDate,
            ) ?? [],
          )
        : findLatestYear(
            application.answers.signature?.committee?.records?.map(
              (signature) => signature.signatureDate,
            ) ?? [],
          )

    const channels =
      application.answers.advert.channels?.map((channel) => {
        return {
          name: channel.name,
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
        proposedAdvertId: uuid(),
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
  ): Promise<ResultWrapper<CaseChannel>> {
    const channel = await this.caseChannelModel.create(
      {
        name: body.name,
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

    const newChannel = await this.caseChannelModel.findByPk(channel.id, {
      transaction,
    })

    if (!newChannel) {
      this.logger.warn('Failed to find newly created channel', {
        category: LOGGING_CATEGORY,
        caseId,
        channelId: channel.id,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create channel',
      })
    }

    const migrated = caseChannelMigrate(newChannel)

    return ResultWrapper.ok(migrated)
  }

  @LogAndHandle()
  @Transactional()
  async createCaseByAdvert(
    body: Advert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ id: string }>> {
    const caseId = uuid()

    const existingCase = await this.caseModel.findOne({
      where: { advertId: body.id },
      transaction,
    })

    if (existingCase) {
      return ResultWrapper.err({
        code: 409,
        message: 'Case already exists for this advert',
      })
    }

    const missingFields: string[] = []
    if (!body.involvedParty?.id) {
      missingFields.push('involvedPartyId')
    }
    if (!body.department?.id) {
      missingFields.push('departmentId')
    }
    if (!body.type?.id) {
      missingFields.push('advertTypeId')
    }

    if (!body.involvedParty?.id || !body.department?.id || !body.type?.id) {
      return ResultWrapper.err({
        code: 400,
        message: `Cannot create case from advert. Missing required fields: ${missingFields.join(', ')}`,
      })
    }

    const promises = await Promise.all([
      this.utilityService.caseStatusLookup(
        CaseStatusEnum.Published,
        transaction,
      ),
      this.utilityService.caseTagLookup(
        CaseTagEnum.MultipleReviewers,
        transaction,
      ),
      this.utilityService.caseCommunicationStatusLookup(
        CaseCommunicationStatus.Done,
        transaction,
      ),
      this.utilityService.generateInternalCaseNumber(transaction),
    ])

    const advertCategories = ResultWrapper.unwrap(
      await this.utilityService.getAdvertCategoryIds(body.id, transaction),
    )

    const categoriesResult = advertCategories ?? []

    const [
      caseStatusResult,
      caseTagResult,
      caseCommunicationStatusResult,
      internalCaseNumberResult,
    ] = promises

    const valuesResult = {
      caseBody: {
        id: caseId,
        applicationId: body.id,
        advertId: body.id,
        statusId: caseStatusResult.unwrap().id,
        tagId: caseTagResult.unwrap().id,
        communicationStatusId: caseCommunicationStatusResult.unwrap().id,
        involvedPartyId: body.involvedParty.id,
        departmentId: body.department.id,
        advertTypeId: body.type.id,
        year: body.publicationNumber?.year
          ? body.publicationNumber.year
          : body.signatureDate
            ? new Date(body.signatureDate).getFullYear()
            : new Date().getFullYear(),
        caseNumber: internalCaseNumberResult.unwrap().internalCaseNumber,
        advertTitle: body.subject ?? '',
        html: body.document.html ?? '',
        requestedPublicationDate: body.publicationDate ?? '',
        assignedUserId: null,
        publishedAt: body.publicationDate ?? '',
        price: 0,
        paid: true,
        fastTrack: false,
        message: null,
        isLegacy: true,
        createdAt: body.createdDate ?? '',
        updatedAt: body.updatedDate ?? '',
        proposedAdvertId: body.id,
        publicationNumber: body.publicationNumber?.number ?? '',
      },
    }

    const createCaseResult = await this.create(
      valuesResult.caseBody,
      transaction,
    )

    if (!createCaseResult.result.ok) {
      return createCaseResult
    }

    await Promise.all(
      categoriesResult.map((cat) =>
        this.createCaseCategory(caseId, cat, transaction),
      ),
    )

    await this.signatureService.createSignature(
      caseId,
      {
        involvedPartyId: body.involvedParty.id,
        records: [],
      },
      transaction,
    )

    return ResultWrapper.ok({ id: caseId })
  }

  @LogAndHandle()
  async createCaseByApplication(
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

    const regularSignature = application.answers.signature.regular
    const committeeSignature = application.answers.signature.committee
    const signatureType =
      application.answers.misc?.signatureType === SignatureType.Committee
        ? SignatureType.Committee
        : SignatureType.Regular

    ResultWrapper.unwrap(
      await this.signatureService.createSignature(caseId, {
        involvedPartyId: values.caseBody.involvedPartyId,
        records: (
          (signatureType === SignatureType.Regular
            ? regularSignature?.records
            : committeeSignature?.records) ?? []
        ).map((rec) => ({
          institution: rec.institution,
          signatureDate: rec.signatureDate,
          additional: rec?.additional,
          members:
            rec?.members.map((member) => ({
              name: member.name,
              textAbove: member.above ?? null,
              textBelow: member.below ?? null,
              textAfter: member.after ?? null,
              textBefore: null,
            })) ?? [],
          chairman: rec?.chairman
            ? {
                ...rec.chairman,
                textAbove: rec.chairman.above ?? null,
                textBelow: rec.chairman.below ?? null,
                textAfter: rec.chairman.after ?? null,
                textBefore: null,
              }
            : undefined,
        })),
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

      const highestOrder: number | null = await this.caseAdditionsModel.max(
        'order',
        {
          where: { caseId },
          transaction,
        },
      )

      await this.caseAdditionsModel.create(
        {
          caseId,
          additionId,
          order: highestOrder === null ? 0 : highestOrder + 1,
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
