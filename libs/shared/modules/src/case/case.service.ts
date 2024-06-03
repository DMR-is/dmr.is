import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_USERS, REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
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
} from '@dmr.is/shared/dto'
import { generatePaging } from '@dmr.is/utils'

import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

// import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
// import { HTMLText } from '@island.is/regulations-tools/types'
import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../comment/models'
import { caseParameters, counterResult } from '../helpers'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { IJournalService } from '../journal'
import { AdvertDepartmentDTO } from '../journal/models'
import { Result } from '../types/result'
import { IUtilityService } from '../utility/utility.service.interface'
import { ICaseService } from './case.service.interface'
import {
  CaseCommunicationStatusDto,
  CaseDto,
  CaseStatusDto,
  CaseTagDto,
} from './models'

const LOGGING_CATEGORY = 'CaseService'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IApplicationService))
    private readonly applicationService: IApplicationService,
    @Inject(forwardRef(() => IJournalService))
    private readonly journalService: IJournalService,
    @Inject(forwardRef(() => ICommentService))
    private readonly commentService: ICommentService,

    @Inject(IUtilityService) private readonly utilityService: IUtilityService,

    @InjectModel(CaseDto) private readonly caseModel: typeof CaseDto,
    @InjectModel(CaseStatusDto)
    private readonly caseStatusModel: typeof CaseStatusDto,

    @InjectModel(CaseTagDto) private readonly caseTagModel: typeof CaseTagDto,
    @InjectModel(CaseCommunicationStatusDto)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusDto,

    @InjectModel(AdvertDepartmentDTO)
    private readonly departmentModel: typeof AdvertDepartmentDTO,
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
      throw new Error(JSON.stringify(e))
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
        const existingCase = await this.caseModel.findOne({
          where: {
            applicationId: body.applicationId,
          },
        })

        if (existingCase) {
          this.logger.warn(
            `create, case with application<${body.applicationId}> already exists`,
            {
              applicationId: body.applicationId,
              category: LOGGING_CATEGORY,
            },
          )
          return Promise.resolve({
            ok: false,
            error: {
              code: 400,
              message: `Case with application<${body.applicationId}> already exists`,
            },
          })
        }

        const applicationResponse =
          await this.applicationService.getApplication(body.applicationId)

        if (!applicationResponse.ok) {
          this.logger.error('create, failed to get application', {
            applicationId: body.applicationId,
            category: LOGGING_CATEGORY,
          })
          return Promise.resolve({
            ok: false,
            error: {
              code: 400,
              message: `Failed to get application<${body.applicationId}>`,
            },
          })
        }

        const application = applicationResponse.value.application

        const now = new Date()

        const nextCaseNumber = await this.caseModel.count({
          transaction: t,
          where: {
            year: now.getFullYear(),
            publishedAt: null,
          },
        })

        const caseStatusSubmitted = await this.caseStatusModel.findOne({
          transaction: t,
          where: {
            value: CaseStatus.Submitted,
          },
        })

        if (!caseStatusSubmitted) {
          this.logger.error('create, case status submitted not found', {
            category: LOGGING_CATEGORY,
            caseStatusId: CaseStatus.Submitted,
          })

          return Promise.resolve({
            ok: false,
            error: {
              code: 500,
              message: 'Case status submitted not found',
            },
          })
        }

        const caseTag = await this.caseTagModel.findOne({
          transaction: t,
          where: {
            value: CaseTag.NotStarted,
          },
        })

        if (!caseTag) {
          this.logger.error('create, case tag not started not found', {
            category: LOGGING_CATEGORY,
            caseTagId: CaseTag.NotStarted,
          })

          return Promise.resolve({
            ok: false,
            error: {
              code: 500,
              message: 'Case tag not started not found',
            },
          })
        }

        const caseCommunicationStatus =
          await this.caseCommunicationStatusModel.findOne({
            transaction: t,
            where: {
              value: CaseCommunicationStatus.NotStarted,
            },
          })

        if (!caseCommunicationStatus) {
          this.logger.error(
            'create, case communication status not started not found',
            {
              category: LOGGING_CATEGORY,
              caseCommunicationStatusId: CaseCommunicationStatus.NotStarted,
            },
          )

          return Promise.resolve({
            ok: false,
            error: {
              code: 500,
              message: 'Case communication status not started not found',
            },
          })
        }

        const department = await this.departmentModel.findByPk(
          application.answers.advert.department,
          {
            transaction: t,
          },
        )

        if (!department) {
          this.logger.error(
            `create, department<${application.answers.advert.department}> not found`,
            {
              category: LOGGING_CATEGORY,
              departmentId: application.answers.advert.department,
            },
          )

          return Promise.resolve({
            ok: false,
            error: {
              code: 500,
              message: 'Department not found',
            },
          })
        }

        const newCase = await this.caseModel.create(
          {
            id: uuid(),
            applicationId: application.id,
            year: now.getFullYear(),
            caseNumber: nextCaseNumber + 1, // start at 1
            statusId: caseStatusSubmitted.id,
            tagId: caseTag.id,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isLegacy: false,
            assignedUserId: null,
            communicationStatusId: caseCommunicationStatus.id,
            publishedAt: null,
            price: null,
            paid: false,
            fastTrack: application.answers.publishing?.fastTrack ?? false,
            departmentId: department.id,
            advertTitle: application.answers.advert.title,
            requestedPublicationDate: application.answers.publishing.date,
          },
          {
            returning: ['id'],
            transaction: t,
          },
        )

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

        const activeCase = await this.caseModel.findByPk(newCase.id, {
          include: [
            CaseTagDto,
            CaseStatusDto,
            CaseCommunicationStatusDto,
            {
              model: CaseCommentDto,
              include: [
                {
                  model: CaseCommentTaskDto,
                  include: [CaseCommentTitleDto],
                },
                CaseStatusDto,
                CaseCommentTypeDto,
              ],
            },
          ],
          transaction: t,
        })

        if (!activeCase) {
          this.logger.error('create, failed to get newly created case', {
            category: LOGGING_CATEGORY,
            caseId: newCase.id,
          })

          return Promise.resolve({
            ok: false,
            error: {
              code: 500,
              message: `Failed to get case<${newCase.id}>`,
            },
          })
        }

        return Promise.resolve({
          ok: true,
          value: {
            case: caseMigrate(activeCase),
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

  private async caseStatusLookup(val: string): Promise<{
    value: string
    id: string
    key: string
  }> {
    try {
      const caseStatusRes = await this.caseStatusModel.findOne({
        where: {
          value: val,
        },
      })

      return Promise.resolve(caseStatusRes?.dataValues)
    } catch (error) {
      this.logger.error('Error in caseStatusLookup', {
        val,
        category: LOGGING_CATEGORY,
        error,
      })
      throw new InternalServerErrorException('Failed to lookup case status')
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

      let statusValue = undefined
      if (params.status) {
        const statusVal = await this.caseStatusLookup(params.status)
        statusValue = statusVal.id
      }
      const whereParams = caseParameters(params, statusValue)

      const cases = await this.caseModel.findAll({
        offset: (page - 1) * pageSize,
        limit: pageSize,
        where: whereParams,
        include: [
          CaseTagDto,
          CaseStatusDto,
          CaseCommunicationStatusDto,
          AdvertDepartmentDTO,
          {
            model: CaseCommentDto,
            include: [
              {
                model: CaseCommentTaskDto,
                include: [CaseCommentTitleDto],
              },
              CaseStatusDto,
              CaseCommentTypeDto,
            ],
          },
        ],
      })

      return Promise.resolve({
        ok: true,
        value: {
          cases: cases.map(caseMigrate),
          paging: generatePaging(cases, page, pageSize),
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

  async publish(body: PostCasePublishBody): Promise<Result<undefined>> {
    this.logger.info('publish', {
      caseIds: body.caseIds,
      category: LOGGING_CATEGORY,
    })

    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      this.logger.warn('publish, missing body', {
        category: LOGGING_CATEGORY,
      })
      return Promise.resolve({
        ok: false,
        error: {
          message: 'Missing or invalid body',
          code: 400,
        },
      })
    }

    await this.sequelize.transaction(async (t) => {
      this.caseModel.update(
        {
          publishedAt: new Date().toISOString(),
        },
        {
          where: {
            id: {
              [Op.in]: caseIds,
            },
          },
          transaction: t,
        },
      )

      // for each case, create a comment

      // for each case insert advert

      caseIds.forEach(async (caseId) => {
        const application = await this.case(caseId)

        // await this.journalService.insertAdvert({})
      })
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

      const caseRes = await this.caseModel.findByPk(id)

      if (!caseRes) {
        this.logger.warn(`assign, case<${id}> not found`, {
          caseId: id,
          category: LOGGING_CATEGORY,
        })
        return Promise.resolve({
          ok: false,
          error: {
            message: `Case<${id}> not found`,
            code: 404,
          },
        })
      }

      const mockUser = ALL_MOCK_USERS.find((u) => u.id === userId)

      if (!mockUser) {
        this.logger.warn(`assign, user<${userId}> not found`, {
          userId: userId,
          category: LOGGING_CATEGORY,
        })
        return Promise.resolve({
          ok: false,
          error: {
            message: `User<${userId}> not found`,
            code: 404,
          },
        })
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
        type: CaseCommentType.Assign,
        comment: null,
        from: caseRes.assignedUserId,
        to: mockUser.id, // TODO: REPLACE WITH ACTUAL USER
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
}
