import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  AdvertStatus,
  CaseCommentType,
  CaseCommunicationStatus,
  CaseStatus,
  CaseTag,
  CreateCaseResponse,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  PostApplicationBody,
  PostCasePublishBody,
  UpdateCaseStatusBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

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
import { caseParameters, counterResult } from '../helpers'
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
  CaseDto,
  CaseStatusDto,
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
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }

  @LogAndHandle()
  async overview(
    params?: GetCasesQuery | undefined,
  ): Promise<ResultWrapper<EditorialOverviewResponse>> {
    const cases = (await this.cases(params)).unwrap()

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
      ],
      group: ['status_id', `status.value`],
    })

    return ResultWrapper.ok({
      cases: cases.cases,
      paging: cases.paging,
      totalItems: counterResult(counter),
    })
  }

  @LogAndHandle()
  async create(
    body: PostApplicationBody,
  ): Promise<ResultWrapper<CreateCaseResponse>> {
    return await this.sequelize.transaction<ResultWrapper<CreateCaseResponse>>(
      async (t) => {
        const existingCase =
          await this.utilityService.caseLookupByApplicationId(
            body.applicationId,
          )

        if (existingCase.isOk()) {
          throw new BadRequestException(
            'Case already exists for this application',
          )
        }

        const { application } = (
          await this.applicationService.getApplication(body.applicationId)
        ).unwrap()

        const caseStatus = (
          await this.utilityService.caseStatusLookup(CaseStatus.Submitted)
        ).unwrap()

        const caseTag = (
          await this.utilityService.caseTagLookup(CaseTag.NotStarted)
        ).unwrap()

        const caseCommunicationStatus = (
          await this.utilityService.caseCommunicationStatusLookup(
            CaseCommunicationStatus.NotStarted,
          )
        ).unwrap()

        const now = new Date()
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
        const today = new Date()
        const diff = requestedPublicationDate.getTime() - today.getTime()
        const diffDays = diff / (1000 * 3600 * 24)
        let fastTrack = false
        if (diffDays > 10) {
          fastTrack = true
        }

        const message = application.answers.publishing.message

        const caseId = uuid()
        const msg =
          typeof message === 'string' && message.length > 0 ? message : null

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
            fastTrack: fastTrack,
            advertTitle: application.answers.advert.title,
            requestedPublicationDate: application.answers.publishing.date,
            departmentId: department.id,
            advertTypeId: type.id,
            message: msg,
          },
          {
            returning: ['id'],
            transaction: t,
          },
        )

        const categories = await Promise.all(
          application.answers.publishing.contentCategories.map(
            async (category) => {
              return await this.utilityService.categoryLookup(category.value)
            },
          ),
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
          .filter((c) => c !== null) as { caseId: string; categoryId: string }[]

        await this.caseCategoriesModel.bulkCreate(categoryIds, {
          transaction: t,
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
              transaction: t,
              returning: ['id'],
            },
          )

          await this.caseChannelsModel.bulkCreate(
            newChannels.map((c) => ({
              caseId: caseId,
              channelId: c.id,
            })),
            {
              transaction: t,
            },
          )
        }

        // TODO: When auth is setup, use the user id from the token
        await this.commentService.create(
          newCase.id,
          {
            internal: true,
            type: CaseCommentType.Submit,
            comment: null,
            from: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
            to: null,
          },
          t,
        )

        const newCreatedCase = (
          await this.utilityService.caseLookup(newCase.id, t)
        ).unwrap()

        return ResultWrapper.ok({
          case: caseMigrate(newCreatedCase),
        })
      },
    )
  }

  @LogAndHandle()
  async case(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    const caseWithAdvert = (
      await this.utilityService.getCaseWithAdvert(id)
    ).unwrap()

    return ResultWrapper.ok({
      case: caseWithAdvert,
    })
  }

  @LogAndHandle()
  async cases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>> {
    const page = params?.page ? parseInt(params.page, 10) : 1
    const pageSize = params?.pageSize
      ? parseInt(params.pageSize, 10)
      : DEFAULT_PAGE_SIZE

    const withStatus = params?.status
      ? (await this.utilityService.caseStatusLookup(params.status)).unwrap()
      : undefined

    const whereParams = caseParameters(params, withStatus?.id)

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
  async publish(body: PostCasePublishBody): Promise<ResultWrapper<undefined>> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException()
    }

    const now = new Date().toISOString()

    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatus.Published)
    ).unwrap()

    await this.sequelize.transaction(async (transaction) => {
      await this.caseModel.update(
        {
          publishedAt: now,
          statusId: caseStatus.id,
        },
        {
          where: {
            id: {
              [Op.in]: caseIds,
            },
          },
          transaction: transaction,
        },
      )

      await Promise.all(
        caseIds.map(async (caseId) => {
          const caseWithAdvert = (
            await this.utilityService.getCaseWithAdvert(caseId)
          ).unwrap()

          const { activeCase, advert } = caseWithAdvert
          if (!advert.type) {
            return
          }

          const now = new Date()
          const year = now.getFullYear()
          const number = (
            await this.utilityService.getNextSerialNumber(
              activeCase.advertDepartment.id,
              year,
            )
          ).unwrap()

          const advertId = uuid()
          await this.journalService.create({
            id: advertId,
            department: activeCase.advertDepartment,
            type: advert.type,
            subject: advert.type.title,
            title: activeCase.advertTitle,
            status: '312F62ED-B47A-4A1A-87A4-42B70E8BE4CA' as AdvertStatus,
            publicationNumber: {
              year: year,
              number: number,
              full: `${number}/${year}`,
            },
            createdDate: now.toISOString(),
            updatedDate: now.toISOString(),
            signatureDate: advert.signatureDate,
            publicationDate: now.toISOString(),
            categories: advert.categories,
            involvedParty: {
              id: 'A2A33C95-45CE-4540-BD56-12D964B7699B',
              title: 'Reykjavíkurborg',
              slug: 'reykjavikurborg',
            },
            document: {
              html: advert.documents.full,
              isLegacy: false,
              pdfUrl: null,
            },
            signature: null,
            attachments: [],
          })
        }),
      )

      // for each case, create a comment

      // for each case insert advert

      // caseIds.forEach(async (caseId) => {
      //   const application = await this.case(caseId)

      //    await this.journalService.insertAdvert({})
      // })
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async assign(id: string, userId: string): Promise<ResultWrapper<undefined>> {
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

    await this.commentService.create(id, {
      internal: true,
      type: caseRes.assignedUserId
        ? CaseCommentType.Assign
        : CaseCommentType.AssignSelf,
      comment: null,
      from: caseRes.assignedUserId,
      to: employeeLookup.id, // TODO: REPLACE WITH ACTUAL USER
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateStatus(
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

    await this.commentService.create(id, {
      internal: true,
      type: CaseCommentType.Update,
      comment: null,
      from: caseLookup.assignedUserId,
      to: null,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async updateNextStatus(id: string): Promise<ResultWrapper<undefined>> {
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

    return this.updateStatus(id, { status: nextStatus })
  }

  @LogAndHandle()
  async updatePrice(
    caseId: string,
    price: string,
  ): Promise<ResultWrapper<undefined>> {
    const caseLookup = await this.utilityService.caseLookup(caseId)

    caseLookup.unwrap()

    await this.caseModel.update(
      {
        price: parseFloat(price),
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
  async updateDepartment(
    caseId: string,
    departmentId: string,
  ): Promise<ResultWrapper<undefined>> {
    const caseLookup = (await this.utilityService.caseLookup(caseId)).unwrap()

    const department = (
      await this.utilityService.departmentLookup(departmentId)
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

    const updateApplicationResult =
      await this.applicationService.updateApplication(
        caseLookup.applicationId,
        {
          answers: {
            advert: {
              department: departmentId,
            },
          },
        },
      )

    if (!updateApplicationResult.isOk()) {
      throw new BadRequestException('Failed to update application')
    }

    return ResultWrapper.ok()
  }
}
