import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import {
  ApplicationStates,
  AttachmentTypeParam,
  DEFAULT_PAGE_SIZE,
} from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  AdvertStatus,
  Application,
  ApplicationAttachmentType,
  CaseCommentTypeEnum,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CaseTagEnum,
  CreateCaseChannelBody,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCommunicationSatusesResponse,
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCasePublishBody,
  PresignedUrlResponse,
  UpdateCaseBody,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdateNextStatusBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import {
  enumMapper,
  generatePaging,
  getFastTrack,
  getSignatureBody,
  withTransaction,
} from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { IAttachmentService } from '../attachments/attachment.service.interface'
import {
  ApplicationAttachmentModel,
  ApplicationAttachmentTypeModel,
} from '../attachments/models'
import { ICommentService } from '../comment/comment.service.interface'
import { IJournalService } from '../journal'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertTypeModel,
} from '../journal/models'
import { IS3Service } from '../s3/s3.service.interface'
import { ISignatureService } from '../signature/signature.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { caseParameters } from './mappers/case-parameters.mapper'
import { updateCaseBodyMapper } from './mappers/case-update-body.mapper'
import { caseMigrate } from './migrations/case.migrate'
import { caseCommunicationStatusMigrate } from './migrations/case-communication-status.migrate'
import { caseTagMigrate } from './migrations/case-tag.migrate'
import { CaseCategoriesModel } from './models/case-categories.model'
import { ICaseService } from './case.service.interface'
import { counterResult } from './case.utils'
import {
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from './models'
import { CASE_RELATIONS } from './relations'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IJournalService))
    private readonly journalService: IJournalService,
    @Inject(forwardRef(() => IApplicationService))
    private readonly applicationService: IApplicationService,
    @Inject(forwardRef(() => ICommentService))
    private readonly commentService: ICommentService,
    @Inject(forwardRef(() => IS3Service)) private readonly s3: IS3Service,

    @Inject(forwardRef(() => IAttachmentService))
    private readonly attachmentService: IAttachmentService,

    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
    @InjectModel(CaseChannelModel)
    private readonly caseChannelModel: typeof CaseChannelModel,
    @InjectModel(CaseChannelsModel)
    private readonly caseChannelsModel: typeof CaseChannelsModel,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseCategoriesModel)
    private readonly caseCategoriesModel: typeof CaseCategoriesModel,
    @InjectModel(CaseTagModel)
    private readonly caseTagModel: typeof CaseTagModel,

    @InjectModel(CaseCommunicationStatusModel)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
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
  @Transactional()
  private async getDefaultValues(
    application: Application,
    transaction?: Transaction,
  ) {
    const now = new Date()

    const caseStatus = ResultWrapper.unwrap(
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Submitted),
    )

    const caseTag = ResultWrapper.unwrap(
      await this.utilityService.caseTagLookup(CaseTagEnum.NotStarted),
    )

    const caseCommunicationStatus = ResultWrapper.unwrap(
      await this.utilityService.caseCommunicationStatusLookup(
        CaseCommunicationStatus.NotStarted,
      ),
    )

    const internalCaseNumber = ResultWrapper.unwrap(
      await this.utilityService.generateInternalCaseNumber(),
    )

    const typeId = ResultWrapper.unwrap(
      await this.utilityService.typeLookup(
        application.answers.advert.typeId,
        transaction,
      ),
    )

    const departmentId = ResultWrapper.unwrap(
      await this.utilityService.departmentLookup(
        application.answers.advert.departmentId,
        transaction,
      ),
    )

    /**
     * Get the category ids from the application
     * Check if the ids are correct
     * If they are not correct, throw an error
     */
    const categories = await Promise.all(
      application.answers.advert.categories.map(async (category) => {
        return (await this.utilityService.categoryLookup(category)).unwrap().id
      }),
    )

    const requestedDate = new Date(application.answers.advert.requestedDate)
    const { fastTrack } = getFastTrack(requestedDate)
    const message = application.answers.advert.message

    return {
      caseStatus: caseStatus.id,
      caseTag: caseTag.id,
      caseCommunicationStatus: caseCommunicationStatus.id,
      internalCaseNumber: internalCaseNumber,
      typeId: typeId.id,
      departmentId: departmentId.id,
      requestedDate: requestedDate.toISOString(),
      categories,
      fastTrack,
      message,
      now,
    }
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  private async publishCase(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const now = new Date()

    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Published)
    ).unwrap()

    await this.caseModel.update(
      {
        statusId: caseStatus.id,
        publishedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    const activeCase = (await this.utilityService.caseLookup(caseId)).unwrap()

    const number = (
      await this.utilityService.getNextPublicationNumber(
        activeCase.departmentId,
        transaction,
      )
    ).unwrap()

    const advertStatus = (
      await this.utilityService.advertStatusLookup(AdvertStatus.Published)
    ).unwrap()

    await this.journalService.create(
      {
        departmentId: activeCase.departmentId,
        typeId: activeCase.advertTypeId,
        involvedPartyId: activeCase.involvedParty.id,
        categoryIds: activeCase.categories
          ? activeCase.categories.map((c) => c.id)
          : [],
        statusId: advertStatus.id,
        subject: activeCase.advertTitle,
        publicationNumber: number,
        publicationDate: now,
        signatureDate: now, // TODO: Replace with signature
        isLegacy: activeCase.isLegacy,
        documentHtml: activeCase.html,
        documentPdfUrl: '', // TODO: Replace with pdf url and add advert attachments s3 keys
        attachments: [],
      },
      transaction,
    )

    ResultWrapper.unwrap(
      await this.utilityService.approveApplication(activeCase.applicationId),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCaseTags(): Promise<ResultWrapper<GetTagsResponse>> {
    const tags = await this.caseTagModel.findAll()

    const migrated = tags.map((tag) => caseTagMigrate(tag))

    return ResultWrapper.ok({
      tags: migrated,
    })
  }

  @LogAndHandle()
  async getCasesOverview(
    params?: GetCasesQuery | undefined,
  ): Promise<ResultWrapper<EditorialOverviewResponse>> {
    const cases = (await this.getCases(params)).unwrap()

    const counter = await this.caseModel.findAll({
      attributes: [
        [Sequelize.literal(`status.title`), 'caseStatusTitle'],
        [Sequelize.fn('COUNT', Sequelize.col('status_id')), 'count'],
      ],
      include: [
        {
          model: CaseStatusModel,
          as: 'status',
          attributes: [],
        },
        {
          model: AdvertDepartmentModel,
          where: params?.department
            ? {
                slug: {
                  [Op.in]: params.department,
                },
              }
            : undefined,
        },
        {
          model: AdvertTypeModel,
          where: params?.type
            ? {
                slug: {
                  [Op.in]: params.type,
                },
              }
            : undefined,
        },
        {
          model: AdvertCategoryModel,
          where: params?.category
            ? {
                slug: params?.category,
              }
            : undefined,
        },
      ],
      group: [
        'status_id',
        `status.title`,
        'department.id',
        'advertType.id',
        'categories.id',
        'CaseModel.id',
        'categories->CaseCategoriesModel.case_case_id',
        'categories->CaseCategoriesModel.category_id',
      ],
    })

    return ResultWrapper.ok({
      cases: cases.cases,
      paging: cases.paging,
      totalItems: counterResult(counter),
    })
  }

  /**
   * We do not use the transactional parameter here
   * because we want to use multiple transactions
   */
  @LogAndHandle()
  async createCase(body: PostApplicationBody): Promise<ResultWrapper> {
    // case does not exist so we can create it
    const { application } = (
      await this.applicationService.getApplication(body.applicationId)
    ).unwrap()

    const {
      caseStatus,
      caseTag,
      caseCommunicationStatus,
      internalCaseNumber,
      departmentId,
      typeId,
      requestedDate,
      categories,
      fastTrack,
      message,
      now,
    } = await this.getDefaultValues(application)

    const caseId = uuid()

    // TODO: temp fix for involved party
    const involvedParty = { id: 'e5a35cf9-dc87-4da7-85a2-06eb5d43812f' } // dómsmálaráðuneytið

    const newCase = ResultWrapper.unwrap(
      await withTransaction<ResultWrapper<CaseModel>>(this.sequelize)(
        async (transaction) => {
          this.logger.debug('Creating case')
          const newCase = await this.caseModel.create<CaseModel>(
            {
              id: caseId,
              applicationId: application.id,
              year: now.getFullYear(),
              caseNumber: internalCaseNumber,
              statusId: caseStatus,
              tagId: caseTag,
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              isLegacy: false,
              assignedUserId: null,
              communicationStatusId: caseCommunicationStatus,
              publishedAt: null,
              price: 0,
              paid: false,
              involvedPartyId: involvedParty.id,
              fastTrack: fastTrack,
              advertTitle: application.answers.advert.title,
              requestedPublicationDate: requestedDate,
              departmentId: departmentId,
              advertTypeId: typeId,
              html: application.answers.advert.html,
              message: message,
            },
            {
              returning: ['id'],
              transaction: transaction,
            },
          )
          this.logger.debug('Creating comment')
          // TODO: When auth is setup, use the user id from the token
          await this.commentService.createComment(
            newCase.id,
            {
              internal: true,
              type: CaseCommentTypeEnum.Submit,
              comment: null,
              initiator: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
              receiver: null,
              storeState: true,
            },
            transaction,
          )
          this.logger.debug('Case and case created')
          return ResultWrapper.ok(newCase)
        },
      ),
    )

    this.logger.debug('Creating case categories')
    await withTransaction(this.sequelize)(async (transaction) => {
      await this.caseCategoriesModel.bulkCreate(
        categories.map((c) => ({ caseId: newCase.id, categoryId: c }), {
          transaction: transaction,
        }),
      )
    })
    this.logger.debug('Case categories created')

    const channels = application.answers.advert.channels

    if (channels && channels.length > 0) {
      this.logger.debug('Creating case channels')
      await withTransaction(this.sequelize)(async (channelsTransaction) => {
        const promises = channels.map(async (channel) => {
          ResultWrapper.unwrap(
            await this.createCaseChannel(
              caseId,
              {
                email: channel.email,
                phone: channel.phone,
              },
              channelsTransaction,
            ),
          )
        })

        await Promise.all(promises)
      })
      this.logger.debug('Case channels created')
    }

    const { signatureType } = application.answers.misc
    const signature = application.answers.signatures[signatureType]

    if (!signature) {
      this.logger.warn(
        `CaseService.createCase<${caseId}>: No signature found for signatureType<${signatureType}>`,
      )

      throw new BadRequestException('Signature is missing')
    }

    const signatureBodies = Array.isArray(signature)
      ? signature.map((s) => getSignatureBody(caseId, s))
      : [getSignatureBody(caseId, signature)]

    this.logger.debug('Creating case signatures')
    await withTransaction(this.sequelize)(async (transaction) => {
      const signaturePromises = signatureBodies.map(async (signatureBody) => {
        return ResultWrapper.unwrap(
          await this.signatureService.createCaseSignature(
            signatureBody,
            transaction,
          ),
        )
      })

      return await Promise.all(signaturePromises)
    })
    this.logger.debug('Case signatures created')

    await withTransaction(this.sequelize)(async (transaction) => {
      const additons = ResultWrapper.unwrap(
        await this.attachmentService.getAttachments(
          application.id,
          AttachmentTypeParam.AdditonalDocument,
          transaction,
        ),
      )

      const original = ResultWrapper.unwrap(
        await this.attachmentService.getAttachments(
          application.id,
          AttachmentTypeParam.OriginalDocument,
          transaction,
        ),
      )

      const promises = [...additons.attachments, ...original.attachments].map(
        (attachment) =>
          this.attachmentService.createCaseAttachment(
            caseId,
            attachment.id,
            transaction,
          ),
      )

      await Promise.all(promises)
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCase(
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const updateData = updateCaseBodyMapper(body)

    await this.caseModel.update<CaseModel>(updateData, {
      where: {
        id: body.caseId,
      },
      returning: true,
      transaction,
    })

    // TODO: ApplicationCommunicationChannels?

    if (body.categoryIds?.length) {
      this.updateCaseCategories(
        body.caseId,
        {
          categoryIds: body.categoryIds,
        },
        transaction,
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    const caseLookup = await this.caseModel.findByPk(id, {
      include: [
        ...CASE_RELATIONS,
        {
          model: AdvertDepartmentModel,
        },
        {
          model: AdvertTypeModel,
        },
        {
          model: AdvertCategoryModel,
        },
        {
          model: ApplicationAttachmentModel,
          where: {
            deleted: false,
          },
          include: [ApplicationAttachmentTypeModel],
        },
      ],
    })

    if (!caseLookup) {
      throw new NotFoundException(`Case<${id}> not found`)
    }

    return ResultWrapper.ok({
      case: caseMigrate(caseLookup),
    })
  }

  @LogAndHandle()
  @Transactional()
  async getCases(
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<GetCasesReponse>> {
    const page = params?.page ? parseInt(params.page, 10) : 1
    const pageSize = params?.pageSize
      ? parseInt(params.pageSize, 10)
      : DEFAULT_PAGE_SIZE

    const statusLookups = params?.status?.map((s) => {
      return this.utilityService.caseStatusLookup(s)
    })
    const statusesRes = statusLookups
      ? await Promise.all(statusLookups).then((s) => s.map((ss) => ss.unwrap()))
      : undefined

    const statuses = statusesRes?.map((s) => s.id)

    const whereParams = caseParameters(params, statuses)

    const cases = await this.caseModel.findAndCountAll({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      where: whereParams,
      distinct: true,
      order: [['createdAt', 'DESC']],
      include: [
        ...CASE_RELATIONS,
        {
          model: AdvertDepartmentModel,
          where: params?.department
            ? {
                slug: {
                  [Op.in]: params.department,
                },
              }
            : undefined,
        },
        {
          model: AdvertTypeModel,
          where: params?.type
            ? {
                slug: {
                  [Op.in]: params.type,
                },
              }
            : undefined,
        },
        {
          model: AdvertCategoryModel,
          where: params?.category
            ? {
                slug: {
                  [Op.in]: params.category,
                },
              }
            : undefined,
        },
      ],
    })

    const mapped = cases.rows.map((c) => caseMigrate(c))

    return ResultWrapper.ok({
      cases: mapped,
      paging: generatePaging(mapped, page, pageSize, cases.count),
    })
  }

  @LogAndHandle()
  @Transactional()
  async getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse>> {
    const publicationNumber = (
      await this.utilityService.getNextPublicationNumber(departmentId)
    ).unwrap()

    return ResultWrapper.ok({
      publicationNumber,
    })
  }

  @LogAndHandle()
  @Transactional()
  async publishCases(
    body: PostCasePublishBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException()
    }

    await Promise.all(
      caseIds.map(async (caseId) =>
        ResultWrapper.unwrap(await this.publishCase(caseId, transaction)),
      ),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async assignUserToCase(id: string, userId: string): Promise<ResultWrapper> {
    const caseRes = (await this.utilityService.caseLookup(id)).unwrap()

    const employeeLookup = (
      await this.utilityService.userLookup(userId)
    ).unwrap()

    await this.caseModel.update(
      {
        assignedUserId: userId,
      },
      {
        where: {
          id,
        },
      },
    )

    await this.commentService.createComment(id, {
      internal: true,
      type: caseRes.assignedUserId
        ? CaseCommentTypeEnum.Assign
        : CaseCommentTypeEnum.AssignSelf,
      comment: null,
      initiator: caseRes.assignedUserId,
      receiver: employeeLookup.id, // TODO: REPLACE WITH ACTUAL USER
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateCaseStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<ResultWrapper<undefined>> {
    const caseLookup = (await this.utilityService.caseLookup(id)).unwrap()

    const status = (
      await this.utilityService.caseStatusLookup(body.status)
    ).unwrap()

    await this.caseModel.update(
      {
        statusId: status.id,
      },
      {
        where: {
          id,
        },
      },
    )

    await this.commentService.createComment(id, {
      internal: true,
      type: CaseCommentTypeEnum.Update,
      comment: null,
      initiator: caseLookup.assignedUserId,
      receiver: null,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateCaseNextStatus(
    id: string,
    body: UpdateNextStatusBody,
  ): Promise<ResultWrapper<undefined>> {
    const { currentStatus } = body

    const status = (
      await this.utilityService.caseStatusLookup(currentStatus)
    ).unwrap()

    const nextStatus =
      status.title === CaseStatusEnum.Submitted
        ? CaseStatusEnum.InProgress
        : status.title === CaseStatusEnum.InProgress
        ? CaseStatusEnum.InReview
        : status.title === CaseStatusEnum.InReview
        ? CaseStatusEnum.ReadyForPublishing
        : status.title === CaseStatusEnum.ReadyForPublishing
        ? CaseStatusEnum.Published
        : status.title

    const nextStatusLookup = await this.utilityService.caseStatusLookup(
      nextStatus,
    )

    if (!nextStatusLookup.isOk()) {
      throw new BadRequestException('Invalid status')
    }

    return this.updateCaseStatus(id, { status: nextStatus })
  }

  @LogAndHandle()
  async updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
  ): Promise<ResultWrapper<undefined>> {
    await this.caseModel.update(
      {
        price: body.price,
      },
      {
        where: {
          id: caseId,
        },
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
  ): Promise<ResultWrapper<undefined>> {
    const [_, updatedModels] = await this.caseModel.update(
      {
        departmentId: body.departmentId,
      },
      {
        where: {
          id: caseId,
        },
        returning: true,
      },
    )

    const applicationId = updatedModels[0].applicationId

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(applicationId, {
        answers: {
          advert: {
            departmentId: body.departmentId,
          },
        },
      }),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const [_, updatedModels] = await this.caseModel.update(
      {
        advertTypeId: body.typeId,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
        returning: true,
      },
    )

    const applicationId = updatedModels[0].applicationId

    const updateApplicationResult =
      await this.applicationService.updateApplication(applicationId, {
        answers: {
          advert: {
            typeId: body.typeId,
          },
        },
      })

    if (!updateApplicationResult.isOk()) {
      throw new BadRequestException('Failed to update application')
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()
    const currentCategories = await this.caseCategoriesModel.findAll({
      where: {
        caseId,
      },
      transaction,
    })

    const incomingCategories = await Promise.all(
      body.categoryIds.map(async (categoryId) => {
        ResultWrapper.unwrap(
          await this.utilityService.categoryLookup(categoryId),
        )

        return {
          caseId,
          categoryId,
        }
      }),
    )

    const newCategories = incomingCategories.filter((c) => c !== null) as {
      caseId: string
      categoryId: string
    }[]

    const newCategoryIds = newCategories.map((c) => c.categoryId)

    const toRemove = currentCategories.filter((c) =>
      newCategoryIds.includes(c.categoryId),
    )

    await this.caseCategoriesModel.bulkCreate(newCategories, {
      ignoreDuplicates: true,
      transaction,
    })

    await Promise.all(
      toRemove.map(async (c) => {
        await c.destroy()
      }),
    )

    const newCurrentCategories = await this.caseCategoriesModel.findAll({
      where: {
        caseId,
      },
      transaction,
    })

    const ids = newCurrentCategories.map((c) => c.categoryId)

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(
        caseLookup.applicationId,
        {
          answers: {
            advert: {
              categories: ids,
            },
          },
        },
      ),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const requestedPublicationDate = new Date(body.date)
    const { fastTrack } = getFastTrack(requestedPublicationDate)

    const [_, updatedModels] = await this.caseModel.update(
      {
        requestedPublicationDate: body.date,
        fastTrack: fastTrack,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
        returning: true,
      },
    )

    const applicationId = updatedModels[0].applicationId

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(applicationId, {
        answers: {
          advert: {
            requestedDate: body.date,
          },
        },
      }),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const [_, updatedModels] = await this.caseModel.update(
      {
        advertTitle: body.title,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
        returning: true,
      },
    )

    const applicationId = updatedModels[0].applicationId

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(applicationId, {
        answers: {
          advert: {
            title: body.title,
          },
        },
      }),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePaid(
    caseId: string,
    body: UpdatePaidBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    await this.caseModel.update(
      {
        paid: body.paid,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async udpateCaseTag(
    caseId: string,
    body: UpdateTagBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    await this.caseModel.update(
      {
        tagId: body.tagId,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse>
  > {
    const statuses = (await this.caseCommunicationStatusModel.findAll()).map(
      (s) => caseCommunicationStatusMigrate(s),
    )

    return ResultWrapper.ok({
      statuses,
    })
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const lookup = (
      await this.utilityService.caseCommunicationStatusLookupById(body.statusId)
    ).unwrap()

    if (lookup.title === CaseCommunicationStatus.WaitingForAnswers) {
      this.logger.debug(
        `Communication status set to ${CaseCommunicationStatus.WaitingForAnswers}, rejecting application`,
      )
      return this.updateCommunication(caseId, lookup.id, transaction, true)
    }

    return this.updateCommunication(caseId, lookup.id, transaction)
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseCommunicationStatusByStatus(
    caseId: string,
    status: CaseCommunicationStatus,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const lookup = (
      await this.utilityService.caseCommunicationStatusLookup(status)
    ).unwrap()

    if (status === CaseCommunicationStatus.WaitingForAnswers) {
      this.logger.debug(
        `Communication status set to ${status}, rejecting application`,
      )
      return this.updateCommunication(caseId, lookup.id, transaction, true)
    }

    return this.updateCommunication(caseId, lookup.id, transaction)
  }

  @LogAndHandle()
  @Transactional()
  private async updateCommunication(
    caseId: string,
    communicationLookupId: string,
    transaction?: Transaction,
    reject?: boolean,
  ): Promise<ResultWrapper<undefined>> {
    if (reject) {
      this.logger.debug(
        `Communication status set to ${CaseCommunicationStatus.WaitingForAnswers}, rejecting application`,
      )
      const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

      const { application } = (
        await this.applicationService.getApplication(caseLookup.applicationId)
      ).unwrap()

      // we should only reject the application if the state of the application is submitted
      if (application.state === ApplicationStates.SUBMITTED) {
        ResultWrapper.unwrap(
          await this.utilityService.rejectApplication(caseLookup.applicationId),
        )
      }
    }

    await this.caseModel.update(
      {
        communicationStatusId: communicationLookupId,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    const { attachment } = (
      await this.attachmentService.getCaseAttachment(
        caseId,
        attachmentId,
        transaction,
      )
    ).unwrap()

    const signedUrl = (
      await this.s3.getObject(attachment.fileLocation)
    ).unwrap()

    return Promise.resolve(ResultWrapper.ok({ url: signedUrl }))
  }

  @LogAndHandle()
  @Transactional()
  async overwriteCaseAttachment(
    caseId: string,
    attachmentId: string,
    incomingAttachment: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    // fetch the presigned url for the new attachment

    const signedUrl = (
      await this.s3.getPresignedUrl(incomingAttachment.fileLocation)
    ).unwrap()

    // fetch the old attachment
    const { attachment } = (
      await this.attachmentService.getCaseAttachment(
        caseId,
        attachmentId,
        transaction,
      )
    ).unwrap()

    // mark the old attachment as deleted
    ResultWrapper.unwrap(
      await this.attachmentService.deleteAttachmentByKey(
        attachment.applicationId,
        attachment.fileLocation,
        transaction,
      ),
    )

    const attachmentType = enumMapper(attachment.type.slug, AttachmentTypeParam)

    if (!attachmentType) {
      throw new BadRequestException('Invalid attachment type')
    }

    // create the new attachment
    ResultWrapper.unwrap(
      await this.attachmentService.createAttachment({
        params: {
          caseId,
          applicationId: attachment.applicationId,
          attachmentType: attachmentType,
          body: incomingAttachment,
        },
        transaction,
      }),
    )

    // return the presigned url for the client to upload the new attachment
    return ResultWrapper.ok({ url: signedUrl.url })
  }
}
