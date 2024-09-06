import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE, FAST_TRACK_DAYS } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  AdvertStatus,
  CaseCommentType,
  CaseCommunicationStatus,
  CaseStatus,
  CaseTag,
  CaseTagEnum,
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
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging, getFastTrack } from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

// import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
// import { HTMLText } from '@island.is/regulations-tools/types'
import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import {
  advertCategoryMigrate,
  caseParameters,
  counterResult,
} from '../helpers'
import { caseTagMapper, updateCaseBodyMapper } from '../helpers/mappers/case'
import { caseCommunicationStatusMigrate } from '../helpers/migrations/case/case-communication-status-migrate'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { IJournalService } from '../journal'
import {
  AdvertCategoryDTO,
  AdvertDepartmentDTO,
  AdvertTypeDTO,
} from '../journal/models'
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
    @InjectModel(CaseChannelDto)
    private readonly caseChannelModel: typeof CaseChannelDto,
    @InjectModel(CaseChannelsDto)
    private readonly caseChannelsModel: typeof CaseChannelsDto,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @InjectModel(CaseDto) private readonly caseModel: typeof CaseDto,
    @InjectModel(CaseCategoriesDto)
    private readonly caseCategoriesModel: typeof CaseCategoriesDto,
    @InjectModel(AdvertCategoryDTO)
    private readonly advertCategoryModel: typeof AdvertCategoryDTO,
    @InjectModel(CaseTagDto) private readonly caseTagModel: typeof CaseTagDto,

    @InjectModel(CaseCommunicationStatusDto)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusDto,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  private async publishCase(caseId: string, transaction?: Transaction) {
    this.logger.debug(`Publishing case<${caseId}>`)

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

    const caseWithAdvert = (
      await this.utilityService.getCaseWithAdvert(caseId)
    ).unwrap()

    const { activeCase, advert } = caseWithAdvert

    const number = (
      await this.utilityService.getNextPublicationNumber(
        activeCase.advertDepartment.id,
        transaction,
      )
    ).unwrap()

    const advertStatus = (
      await this.utilityService.advertStatusLookup(AdvertStatus.Published)
    ).unwrap()

    if (!advert.signatureDate) {
      throw new BadRequestException('Signature date is required')
    }

    await this.journalService.create(
      {
        departmentId: activeCase.advertDepartment.id,
        typeId: activeCase.advertType.id,
        involvedPartyId: activeCase.involvedParty.id,
        categoryIds: activeCase.advertCategories.map((c) => c.id),
        statusId: advertStatus.id,
        subject: activeCase.advertTitle,
        publicationNumber: number,
        publicationDate: new Date(),
        signatureDate: new Date(advert.signatureDate),
        isLegacy: activeCase.isLegacy,
        documentHtml: advert.documents.full,
        documentPdfUrl: '',
        attachments: advert.attachments.map((a) => a.url),
      },
      transaction,
    )

    ResultWrapper.unwrap(
      await this.utilityService.approveApplication(activeCase.applicationId),
    )
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

  @LogAndHandle()
  @Transactional()
  async createCase(
    body: PostApplicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponse>> {
    let exists: boolean
    try {
      ResultWrapper.unwrap(
        await this.utilityService.caseLookupByApplicationId(body.applicationId),
      )

      exists = true
    } catch (error) {
      exists = false
    }

    if (exists) {
      throw new BadRequestException(
        `Case with application<${body.applicationId}> already exists`,
      )
    }

    // case does not exist so we can create it
    const { application } = (
      await this.applicationService.getApplication(body.applicationId)
    ).unwrap()

    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatus.Submitted)
    ).unwrap()

    const caseTag = (
      await this.utilityService.caseTagLookup(CaseTagEnum.NotStarted)
    ).unwrap()

    const caseCommunicationStatus = (
      await this.utilityService.caseCommunicationStatusLookup(
        CaseCommunicationStatus.NotStarted,
      )
    ).unwrap()

    const nextCaseNumber = (
      await this.utilityService.generateCaseNumber()
    ).unwrap()

    const department = (
      await this.utilityService.departmentLookup(
        application.answers.advert.department,
      )
    ).unwrap()

    const type = (
      await this.utilityService.typeLookup(application.answers.advert.type)
    ).unwrap()

    const requestedPublicationDate = new Date(
      application.answers.publishing.date,
    )

    const { fastTrack, now } = getFastTrack(requestedPublicationDate)

    const message = application.answers.publishing.message

    const caseId = uuid()
    const msg =
      typeof message === 'string' && message.length > 0 ? message : null

    // TODO: temp fix for involved party
    const involvedParty = { id: 'e5a35cf9-dc87-4da7-85a2-06eb5d43812f' } // dómsmálaráðuneytið

    const newCase = await this.caseModel.create<CaseDto>(
      {
        id: caseId,
        applicationId: application.id,
        year: now.getFullYear(),
        caseNumber: nextCaseNumber,
        statusId: caseStatus.id,
        tagId: caseTag.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isLegacy: false,
        assignedUserId: null,
        communicationStatusId: caseCommunicationStatus.id,
        publishedAt: null,
        price: 0,
        paid: false,
        involvedPartyId: involvedParty.id,
        fastTrack: fastTrack,
        advertTitle: application.answers.advert.title,
        requestedPublicationDate: application.answers.publishing.date,
        departmentId: department.id,
        advertTypeId: type.id,
        message: msg,
      },
      {
        returning: ['id'],
        transaction,
      },
    )

    const categories = await Promise.all(
      application.answers.publishing.contentCategories.map(async (category) => {
        return await this.utilityService.categoryLookup(category.value)
      }),
    )

    const categoryIds = categories
      .map((c) => {
        if (!c) {
          return null
        }

        const cat = c.unwrap()
        return {
          caseId: caseId,
          categoryId: cat.id,
        }
      })
      .filter((c) => c !== null) as {
      caseId: string
      categoryId: string
    }[]

    await this.caseCategoriesModel.bulkCreate(categoryIds, {
      transaction,
    })

    const channels = application.answers.publishing.communicationChannels

    if (channels && channels.length > 0) {
      const caseChannels = channels
        .map((channel) => {
          if (!channel.email && !channel.phone) return null
          return {
            id: uuid(),
            email: channel.email,
            phone: channel.phone,
          }
        })
        .filter((c) => c !== null)

      const newChannels = await this.caseChannelModel.bulkCreate(
        caseChannels.map((c) => ({
          id: c?.id,
          email: c?.email,
          phone: c?.phone,
        })),
        {
          transaction,
          returning: ['id'],
        },
      )

      await this.caseChannelsModel.bulkCreate(
        newChannels.map((c) => ({
          caseId: caseId,
          channelId: c.id,
        })),
        {
          transaction,
        },
      )
    }

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

    const newCreatedCase = (
      await this.utilityService.caseLookup(newCase.id, transaction)
    ).unwrap()

    return ResultWrapper.ok({
      case: caseMigrate(newCreatedCase),
    })
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
      this.updateCaseCategories(body.caseId, {
        categoryIds: body.categoryIds,
      })
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    const caseWithAdvert = (
      await this.utilityService.getCaseWithAdvert(id)
    ).unwrap()

    return ResultWrapper.ok({
      case: caseWithAdvert,
    })
  }

  @LogAndHandle()
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
  async getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse>> {
    const doesDepartmentExist = (
      await this.utilityService.departmentLookup(departmentId)
    ).unwrap()

    const publicationNumber = (
      await this.utilityService.getNextPublicationNumber(doesDepartmentExist.id)
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
      caseIds.map(
        async (caseId) => await this.publishCase(caseId, transaction),
      ),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async assignUserToCase(
    id: string,
    userId: string,
  ): Promise<ResultWrapper<undefined>> {
    if (!id || !userId) {
      throw new BadRequestException()
    }

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
  async updateCaseNextStatus(id: string): Promise<ResultWrapper<undefined>> {
    const activeCase = (await this.utilityService.caseLookup(id)).unwrap()

    const status = (
      await this.utilityService.caseStatusLookup(activeCase.status.value)
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
    price: string,
  ): Promise<ResultWrapper<undefined>> {
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

    await this.caseModel.update(
      {
        price: parseFloat(price),
      },
      {
        where: {
          id: caseLookup.id,
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
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

    const department = (
      await this.utilityService.departmentLookup(body.departmentId)
    ).unwrap()

    await this.caseModel.update(
      {
        departmentId: department.id,
      },
      {
        where: {
          id: caseId,
        },
      },
    )

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(
        caseLookup.applicationId,
        {
          answers: {
            advert: {
              department: body.departmentId,
            },
          },
        },
      ),
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
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

    const typeLookup = (
      await this.utilityService.typeLookup(body.typeId)
    ).unwrap()

    await this.caseModel.update(
      {
        advertTypeId: typeLookup.id,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    const updateApplicationResult =
      await this.applicationService.updateApplication(
        caseLookup.applicationId,
        {
          answers: {
            advert: {
              type: body.typeId,
            },
          },
        },
      )

    if (!updateApplicationResult.isOk()) {
      throw new BadRequestException('Failed to update application')
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
  ): Promise<ResultWrapper<undefined>> {
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

    const currentCategories = await this.caseCategoriesModel.findAll({
      where: {
        caseId,
      },
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
    })

    const ids = newCurrentCategories.map((c) => c.categoryId)

    const categories = await this.advertCategoryModel.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    })

    const migrated = categories.map((c) => advertCategoryMigrate(c))

    const mapped = migrated.map((c) => ({
      label: c.title,
      value: c.id,
    }))

    const applicationLookup = (
      await this.applicationService.getApplication(caseLookup.applicationId)
    ).unwrap()

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(
        caseLookup.applicationId,
        {
          answers: {
            publishing: {
              contentCategories: mapped,
              communicationChannels:
                applicationLookup.application.answers.publishing
                  .communicationChannels,
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
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

    const requestedPublicationDate = new Date(body.date)
    const createdAt = new Date(caseLookup.createdAt)
    const timeDiff = Math.abs(
      requestedPublicationDate.getTime() - createdAt.getTime(),
    )
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    await this.caseModel.update(
      {
        requestedPublicationDate: body.date,
        fastTrack: daysDiff <= FAST_TRACK_DAYS,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
    )

    const applicationLookup = (
      await this.applicationService.getApplication(caseLookup.applicationId)
    ).unwrap()

    ResultWrapper.unwrap(
      await this.applicationService.updateApplication(
        caseLookup.applicationId,
        {
          answers: {
            publishing: {
              date: body.date,
              contentCategories:
                applicationLookup.application.answers.publishing
                  .contentCategories,
              communicationChannels:
                applicationLookup.application.answers.publishing
                  .communicationChannels,
            },
          },
        },
      ),
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
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

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
      await this.applicationService.updateApplication(
        caseLookup.applicationId,
        {
          answers: {
            advert: {
              title: body.title,
            },
          },
        },
      ),
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
    ResultWrapper.unwrap(await this.utilityService.caseLookup(caseId))

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
    ResultWrapper.unwrap(await this.utilityService.caseLookup(caseId))

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
