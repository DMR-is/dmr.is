import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  AdvertStatus,
  Application,
  CaseCommentType,
  CaseCommunicationStatus,
  CaseStatus,
  CaseTag,
  CaseTagEnum,
  CreateCaseChannelBody,
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCommunicationSatusesResponse,
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  PostApplicationBody,
  PostCasePublishBody,
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
  generatePaging,
  getFastTrack,
  getSignatureBody,
  withTransaction,
} from '@dmr.is/utils'

import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import { caseParameters, counterResult } from '../helpers'
import { caseTagMapper, updateCaseBodyMapper } from '../helpers/mappers/case'
import { caseCommunicationStatusMigrate } from '../helpers/migrations/case/case-communication-status-migrate'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { IJournalService } from '../journal'
import {
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertTypeDTO,
} from '../journal/models'
import {
  SignatureMemberModel,
  SignatureMembersModel,
  SignatureModel,
  SignatureTypeModel,
} from '../signature/models'
import { ISignatureService } from '../signature/signature.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { CaseCategoriesDto } from './models/CaseCategories'
import { ICaseService } from './case.service.interface'
import {
  CaseChannelDto,
  CaseChannelsDto,
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
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
    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
    @InjectModel(CaseChannelDto)
    private readonly caseChannelModel: typeof CaseChannelDto,
    @InjectModel(CaseChannelsDto)
    private readonly caseChannelsModel: typeof CaseChannelsDto,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @InjectModel(CaseDto) private readonly caseModel: typeof CaseDto,
    @InjectModel(CaseCategoriesDto)
    private readonly caseCategoriesModel: typeof CaseCategoriesDto,
    @InjectModel(CaseTagDto) private readonly caseTagModel: typeof CaseTagDto,

    @InjectModel(CaseCommunicationStatusDto)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusDto,
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
      await this.utilityService.caseStatusLookup(CaseStatus.Submitted),
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
      await this.utilityService.caseStatusLookup(CaseStatus.Published)
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
        categoryIds: activeCase.categories.map((c) => c.id),
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

    const migrated: CaseTag[] = tags.map((t) => ({
      id: t.id,
      key: t.key,

      value: caseTagMapper(t.value)!,
    }))

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
        [Sequelize.literal(`status.value`), 'caseStatusValue'],
        [Sequelize.fn('COUNT', Sequelize.col('status_id')), 'count'],
      ],
      include: [
        {
          model: CaseStatusDto,
          as: 'status',
          attributes: [],
        },
        {
          model: AdvertDepartmentDTO,
          where: params?.department
            ? {
                slug: {
                  [Op.in]: params.department,
                },
              }
            : undefined,
        },
        {
          model: AdvertTypeDTO,
          where: params?.type
            ? {
                slug: {
                  [Op.in]: params.type,
                },
              }
            : undefined,
        },
        {
          model: AdvertCategoryDTO,
          where: params?.category
            ? {
                slug: params?.category,
              }
            : undefined,
        },
      ],
      group: [
        'status_id',
        `status.value`,
        'department.id',
        'advertType.id',
        'categories.id',
        'CaseDto.id',
        'categories->CaseCategoriesDto.case_case_id',
        'categories->CaseCategoriesDto.category_id',
      ],
    })

    return ResultWrapper.ok({
      cases: cases.cases,
      paging: cases.paging,
      totalItems: counterResult(counter),
    })
  }

  /**
   * We do not use the transactional parameter here because we want to handle the transaction in the createCase method
   * @returns
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
      await withTransaction<ResultWrapper<CaseDto>>(this.sequelize)(
        async (transaction) => {
          const newCase = await this.caseModel.create<CaseDto>(
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

          // TODO: When auth is setup, use the user id from the token
          await this.commentService.createComment(
            newCase.id,
            {
              internal: true,
              type: CaseCommentType.Submit,
              comment: null,
              initiator: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
              receiver: null,
              storeState: true,
            },
            transaction,
          )
          return ResultWrapper.ok(newCase)
        },
      ),
    )

    await withTransaction(this.sequelize)(async (transaction) => {
      await this.caseCategoriesModel.bulkCreate(
        categories.map((c) => ({ caseId: newCase.id, categoryId: c }), {
          transaction: transaction,
        }),
      )
    })

    const channels = application.answers.advert.channels

    if (channels && channels.length > 0) {
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

    const newCreatedCase = (
      await this.utilityService.caseLookup(newCase.id)
    ).unwrap()

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCase(
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const updateData = updateCaseBodyMapper(body)

    await this.caseModel.update<CaseDto>(updateData, {
      where: {
        id: body.caseId,
      },
      transaction,
    })

    // TODO: ApplicationCommunicationChannels?

    if (body.categoryIds?.length) {
      this.updateCaseCategories(
        body.caseId,
        {
          applicationId: body.applicationId,
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
          model: AdvertDepartmentDTO,
        },
        {
          model: AdvertTypeDTO,
        },
        {
          model: AdvertCategoryDTO,
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
          model: AdvertDepartmentDTO,
          where: params?.department
            ? {
                slug: {
                  [Op.in]: params.department,
                },
              }
            : undefined,
        },
        {
          model: AdvertTypeDTO,
          where: params?.type
            ? {
                slug: {
                  [Op.in]: params.type,
                },
              }
            : undefined,
        },
        {
          model: AdvertCategoryDTO,
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
        ? CaseCommentType.Assign
        : CaseCommentType.AssignSelf,
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
      type: CaseCommentType.Update,
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
      status.value === CaseStatus.Submitted
        ? CaseStatus.InProgress
        : status.value === CaseStatus.InProgress
        ? CaseStatus.InReview
        : status.value === CaseStatus.InReview
        ? CaseStatus.ReadyForPublishing
        : status.value === CaseStatus.ReadyForPublishing
        ? CaseStatus.Published
        : status.value

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
        price: parseFloat(body.price),
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
    await this.caseModel.update(
      {
        departmentId: body.departmentId,
      },
      {
        where: {
          id: caseId,
        },
      },
    )

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(body.applicationId, {
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
    await this.caseModel.update(
      {
        advertTypeId: body.typeId,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    const updateApplicationResult =
      await this.applicationService.updateApplication(body.applicationId, {
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
      await this.applicationService.updateApplication(body.applicationId, {
        answers: {
          advert: {
            categories: ids,
          },
        },
      }),
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

    await this.caseModel.update(
      {
        requestedPublicationDate: body.date,
        fastTrack: fastTrack,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(body.applicationId, {
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
    await this.caseModel.update(
      {
        advertTitle: body.title,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(body.applicationId, {
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

    if (lookup.value === CaseCommunicationStatus.WaitingForAnswers) {
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

      ResultWrapper.unwrap(
        await this.utilityService.rejectApplication(caseLookup.applicationId),
      )
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
}
