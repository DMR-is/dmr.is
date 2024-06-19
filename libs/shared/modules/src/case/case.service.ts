import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS, REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  AdvertStatus,
  CaseChannel,
  CaseCommentType,
  CaseCommunicationStatus,
  CaseEditorialOverview,
  CaseStatus,
  CaseTag,
  CreateCaseResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  PostApplicationBody,
  PostCasePublishBody,
  UpdateCaseStatusBody,
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

// import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
// import { HTMLText } from '@island.is/regulations-tools/types'
import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import { Audit } from '../decorators/audit.decorator'
import { HandleException } from '../decorators/handle-exception.decorator'
import { caseParameters, counterResult } from '../helpers'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { IJournalService } from '../journal'
import { AdvertDepartmentDTO } from '../journal/models'
import { handleBadRequest } from '../lib/utils'
import { Result } from '../types/result'
import { IUtilityService } from '../utility/utility.service.interface'
import { ICaseService } from './case.service.interface'
import {
  CaseChannelDto,
  CaseChannelsDto,
  CaseDto,
  CaseStatusDto,
} from './models'
import { CASE_RELATIONS } from './relations'
import { isDefined } from '@island.is/shared/utils'

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
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }

  async overview(
    params?: GetCasesQuery | undefined,
  ): Promise<Result<CaseEditorialOverview>> {
    try {
      const res = await this.cases(params ?? {})

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

      if (!res.ok) {
        return res
      }

      return Promise.resolve({
        ok: true,
        value: {
          data: res.value.cases,
          paging: res.value.paging,
          totalItems: counterResult(counter),
        },
      })
    } catch (e) {
      this.logger.error('Error in overview', {
        category: LOGGING_CATEGORY,
        error: e,
      })

      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: 'Failed to get overview',
        },
      })
    }
  }

  async create(body: PostApplicationBody): Promise<Result<CreateCaseResponse>> {
    try {
      this.logger.info('create', {
        applicationId: body.applicationId,
        category: LOGGING_CATEGORY,
      })

      const newCase = await this.sequelize.transaction<
        Result<CreateCaseResponse>
      >(async (t) => {
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

        const newCase = await this.caseModel.create(
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
            message: msg,
          },
          {
            returning: ['id'],
            transaction: t,
          },
        )

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
            .filter(isDefined)

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

        return Promise.resolve({
          ok: true,
          value: {
            case: caseMigrate(newCaseLookup.value),
          },
        })
      })

      return Promise.resolve(newCase)
    } catch (error) {
      this.logger.error('Error in createCase', {
        error: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
        category: LOGGING_CATEGORY,
      })
      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: 'Failed to create case',
        },
      })
    }
  }

  async case(id: string): Promise<Result<GetCaseResponse>> {
    this.logger.info(`case<${id}>`, {
      caseId: id,
      category: LOGGING_CATEGORY,
    })
    try {
      const result = await this.utilityService.getCaseWithAdvert(id)

      if (!result.ok) {
        return Promise.resolve(result)
      }

      return Promise.resolve({
        ok: true,
        value: { case: result.value },
      })
    } catch (error) {
      this.logger.error(`Error in case<${id}>`, {
        caseId: id,
        category: LOGGING_CATEGORY,
        error: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
      })

      return Promise.resolve({
        ok: false,
        error: {
          code: 500,
          message: `Failed to get case<${id}>`,
        },
      })
    }
  }

  async cases(params: GetCasesQuery): Promise<Result<GetCasesReponse>> {
    try {
      this.logger.info('cases', {
        category: LOGGING_CATEGORY,
        params,
      })

      const page = params?.page ?? 1
      const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

      let statusLookup: Result<CaseStatusDto> | undefined = undefined
      if (params.status) {
        statusLookup = await this.utilityService.caseStatusLookup(params.status)
      }

      const whereParams = caseParameters(
        params,
        statusLookup?.ok ? statusLookup.value.id : undefined,
      )

      const cases = await this.caseModel.findAndCountAll({
        offset: (page - 1) * pageSize,
        limit: pageSize,
        where: whereParams,
        include: [
          ...CASE_RELATIONS,
          {
            model: AdvertDepartmentDTO,
            where: params.department
              ? {
                  slug: params.department,
                }
              : undefined,
          },
        ],
      })

      const mapped = cases.rows.map((c) => caseMigrate(c))

      return Promise.resolve({
        ok: true,
        value: {
          cases: mapped,
          paging: generatePaging(mapped, page, pageSize, cases.count),
        },
      })
    } catch (error) {
      this.logger.error('Error in getCases', {
        category: LOGGING_CATEGORY,
        error: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
      })
      return Promise.resolve({
        ok: false,
        error: {
          message: 'Failed to get cases',
          code: 500,
        },
      })
    }
  }

  @Audit()
  @HandleException()
  async publish(body: PostCasePublishBody): Promise<Result<undefined>> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      return handleBadRequest({
        category: LOGGING_CATEGORY,
        method: 'publish',
        reason: 'Missing or invalid body',
      })
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
        caseIds.map(async (caseId, index) => {
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

    return Promise.resolve({
      ok: true,
      value: undefined,
    })
  }

  async assign(id: string, userId: string): Promise<Result<undefined>> {
    this.logger.info(`assign, case<${id}>`, {
      caseId: id,
      userId: userId,
      category: LOGGING_CATEGORY,
    })

    try {
      if (!id || !userId) {
        this.logger.warn('assign, missing id or userId', {
          category: LOGGING_CATEGORY,
          userId: userId,
          caseId: id,
        })
        return Promise.resolve({
          ok: false,
          error: {
            message: 'Missing or invalid body',
            code: 400,
          },
        })
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

      return Promise.resolve({
        ok: true,
        value: undefined,
      })
    } catch (e) {
      this.logger.error('Error in assign', {
        error: e,
        category: LOGGING_CATEGORY,
      })
      return Promise.resolve({
        ok: false,
        error: {
          message: 'Failed to assign user to the case',
          code: 500,
        },
      })
    }
  }

  async updateStatus(
    id: string,
    body: UpdateCaseStatusBody,
  ): Promise<Result<undefined>> {
    try {
      this.logger.info(`updateStatus, case<${id}>`, {
        caseId: id,
        category: LOGGING_CATEGORY,
      })

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

      return Promise.resolve({
        ok: true,
        value: undefined,
      })
    } catch (error) {
      this.logger.error('Error in updateStatus', {
        category: LOGGING_CATEGORY,
        error,
      })
      return Promise.resolve({
        ok: false,
        error: {
          message: 'Failed to update case status',
          code: 500,
        },
      })
    }
  }
}
