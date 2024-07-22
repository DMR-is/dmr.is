import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { Audit, HandleException } from '@dmr.is/decorators'
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
import { Result } from '@dmr.is/types'
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

const LOGGING_CATEGORY = 'CaseService'

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

  @Audit()
  @HandleException()
  async overview(
    params?: GetCasesQuery | undefined,
  ): Promise<Result<EditorialOverviewResponse>> {
    const casesResponse = await this.cases(params)

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

    if (!casesResponse.ok) {
      return casesResponse
    }

    return {
      ok: true,
      value: {
        cases: casesResponse.value.cases,
        paging: casesResponse.value.paging,
        totalItems: counterResult(counter),
      },
    }
  }

  @Audit()
  @HandleException()
  async create(body: PostApplicationBody): Promise<Result<CreateCaseResponse>> {
    return await this.sequelize.transaction<Result<CreateCaseResponse>>(
      async (t) => {
        const existingCaseLookup =
          await this.utilityService.caseLookupByApplicationId(
            body.applicationId,
          )

        if (existingCaseLookup.ok) {
          this.logger.warn('Case already exists for this application', {
            applicationId: body.applicationId,
            category: LOGGING_CATEGORY,
          })

          return {
            ok: false,
            error: {
              code: 409,
              message: 'Case already exists for this application',
            },
          }
        }

        const applicationLookup = await this.applicationService.getApplication(
          body.applicationId,
        )

        if (!applicationLookup.ok) {
          return applicationLookup
        }

        const caseStatusLookup = await this.utilityService.caseStatusLookup(
          CaseStatus.Submitted,
        )

        if (!caseStatusLookup.ok) {
          return caseStatusLookup
        }

        const caseTagLookup = await this.utilityService.caseTagLookup(
          CaseTag.NotStarted,
        )

        if (!caseTagLookup.ok) {
          return caseTagLookup
        }

        const caseCommunicationStatus =
          await this.utilityService.caseCommunicationStatusLookup(
            CaseCommunicationStatus.NotStarted,
          )

        if (!caseCommunicationStatus.ok) {
          return caseCommunicationStatus
        }

        const now = new Date()
        const application = applicationLookup.value.application
        const nextCaseNumber = await this.utilityService.generateCaseNumber()

        if (!nextCaseNumber.ok) {
          return nextCaseNumber
        }

        const departmentLookup = await this.utilityService.departmentLookup(
          application.answers.advert.department,
        )

        if (!departmentLookup.ok) {
          return departmentLookup
        }

        const typeLookup = await this.utilityService.typeLookup(
          application.answers.advert.type,
        )

        if (!typeLookup.ok) {
          return typeLookup
        }

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

        const caseNumber = nextCaseNumber.value

        const message = application.answers.publishing.message

        const caseId = uuid()
        const msg =
          typeof message === 'string' && message.length > 0 ? message : null

        const newCase = await this.caseModel.create<CaseDto>(
          {
            id: caseId,
            applicationId: application.id,
            year: now.getFullYear(),
            caseNumber: caseNumber,
            statusId: caseStatusLookup.value.id,
            tagId: caseTagLookup.value.id,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isLegacy: false,
            assignedUserId: null,
            communicationStatusId: caseCommunicationStatus.value.id,
            publishedAt: null,
            price: 0,
            paid: false,
            fastTrack: fastTrack,
            advertTitle: application.answers.advert.title,
            requestedPublicationDate: application.answers.publishing.date,
            departmentId: departmentLookup.value.id,
            advertTypeId: typeLookup.value.id,
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
            if (!c.ok) {
              return null
            }
            return {
              caseId: newCase.id,
              categoryId: c.value.id,
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

        const newCaseLookup = await this.utilityService.caseLookup(
          newCase.id,
          t,
        )

        if (!newCaseLookup.ok) {
          return newCaseLookup
        }

        return {
          ok: true,
          value: {
            case: caseMigrate(newCaseLookup.value),
          },
        }
      },
    )
  }

  @Audit()
  @HandleException()
  async case(id: string): Promise<Result<GetCaseResponse>> {
    const result = await this.utilityService.getCaseWithAdvert(id)

    if (!result.ok) {
      return result
    }

    return {
      ok: true,
      value: { case: result.value },
    }
  }

  @Audit()
  @HandleException()
  async cases(params?: GetCasesQuery): Promise<Result<GetCasesReponse>> {
    const page = params?.page ? parseInt(params.page, 10) : 1
    const pageSize = params?.pageSize
      ? parseInt(params.pageSize, 10)
      : DEFAULT_PAGE_SIZE

    let statusLookup: Result<CaseStatusDto> | undefined = undefined
    if (params?.status) {
      statusLookup = await this.utilityService.caseStatusLookup(params.status)
    }

    if (statusLookup !== undefined && !statusLookup.ok) {
      throw new BadRequestException(
        `Invalid query parameter status: ${params?.status}`,
      )
    }

    const whereParams = caseParameters(
      params,
      statusLookup?.ok ? statusLookup.value.id : undefined,
    )

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

    return {
      ok: true,
      value: {
        cases: mapped,
        paging: generatePaging(mapped, page, pageSize, cases.count),
      },
    }
  }

  @Audit()
  @HandleException()
  async publish(body: PostCasePublishBody): Promise<Result<undefined>> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException()
    }

    const now = new Date().toISOString()

    const publishedStatusLookup = await this.utilityService.caseStatusLookup(
      CaseStatus.Published,
    )

    if (!publishedStatusLookup.ok) {
      return publishedStatusLookup
    }

    await this.sequelize.transaction(async (transaction) => {
      await this.caseModel.update(
        {
          publishedAt: now,
          statusId: publishedStatusLookup.value.id,
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
          const caseLookup = await this.case(caseId)

          if (!caseLookup.ok) {
            return
          }

          if (caseLookup.value.case === null) {
            return
          }

          const { activeCase, advert } = caseLookup.value.case

          if (!advert.type) {
            return
          }

          const now = new Date()
          const year = now.getFullYear()
          const number = await this.utilityService.getNextSerialNumber(
            activeCase.advertDepartment.id,
            year,
          )

          if (!number.ok) {
            return
          }

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
              number: number.value, // TODO replace with count
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

    this.logger.info('publish, successfully publised cases', {
      caseIds: body.caseIds,
      category: LOGGING_CATEGORY,
    })

    return {
      ok: true,
      value: undefined,
    }
  }

  @Audit()
  @HandleException()
  async assign(id: string, userId: string): Promise<Result<undefined>> {
    if (!id || !userId) {
      throw new BadRequestException()
    }

    const caseRes = await this.utilityService.caseLookup(id)

    if (!caseRes.ok) {
      return caseRes
    }

    const employeeLookup = await this.utilityService.userLookup(userId)

    if (!employeeLookup.ok) {
      return employeeLookup
    }

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
      type: caseRes.value.assignedUserId
        ? CaseCommentType.Assign
        : CaseCommentType.AssignSelf,
      comment: null,
      from: caseRes.value.assignedUserId,
      to: employeeLookup.value.id, // TODO: REPLACE WITH ACTUAL USER
    })

    return {
      ok: true,
      value: undefined,
    }
  }

  @Audit()
  @HandleException()
  async updateStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<Result<undefined>> {
    const caseLookup = await this.utilityService.caseLookup(id)

    if (!caseLookup.ok) {
      return caseLookup
    }

    const status = await this.utilityService.caseStatusLookup(body.status)

    if (!status.ok) {
      return status
    }

    await this.caseModel.update(
      {
        statusId: status.value.id,
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
      from: caseLookup.value.assignedUserId,
      to: null,
    })

    return {
      ok: true,
      value: undefined,
    }
  }

  @Audit()
  @HandleException()
  async updateNextStatus(id: string): Promise<Result<undefined>> {
    const caseLookup = await this.utilityService.caseLookup(id)

    if (!caseLookup.ok) {
      return caseLookup
    }

    const activeCase = caseLookup.value

    const currentStatus = await this.utilityService.caseStatusLookup(
      activeCase.status.value,
    )

    if (!currentStatus.ok) {
      return currentStatus
    }

    const status = currentStatus.value

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

    if (!nextStatusLookup.ok) {
      return nextStatusLookup
    }

    return this.updateStatus(id, { status: nextStatus })
  }

  @Audit()
  @HandleException()
  async updatePrice(caseId: string, price: string): Promise<Result<undefined>> {
    const caseLookup = await this.utilityService.caseLookup(caseId)

    if (!caseLookup.ok) {
      return caseLookup
    }

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

    return {
      ok: true,
      value: undefined,
    }
  }

  @Audit()
  @HandleException()
  async updateDepartment(
    caseId: string,
    departmentId: string,
  ): Promise<Result<undefined>> {
    const caseLookup = await this.utilityService.caseLookup(caseId)
    if (!caseLookup.ok) {
      return caseLookup
    }

    const departmentLookup = await this.utilityService.departmentLookup(
      departmentId,
    )
    if (!departmentLookup.ok) {
      return departmentLookup
    }

    await this.caseModel.update(
      {
        departmentId: departmentLookup.value.id,
      },
      {
        where: {
          id: caseId,
        },
      },
    )

    const updateApplicationResult =
      await this.applicationService.updateApplication(
        caseLookup.value.applicationId,
        {
          answers: {
            advert: {
              department: departmentId,
            },
          },
        },
      )

    if (!updateApplicationResult.ok) {
      return updateApplicationResult
    }

    return {
      ok: true,
      value: undefined,
    }
  }
}
