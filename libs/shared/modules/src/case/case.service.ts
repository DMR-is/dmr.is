import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
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

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

// import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
// import { HTMLText } from '@island.is/regulations-tools/types'
import { IApplicationService } from '../application/application.service.interface'
import { ICommentService } from '../comment/comment.service.interface'
import { caseParameters, counterResult } from '../helpers'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
import { Result } from '../types/result'
import { IUtilityService } from '../utility/utility.service.interface'
import { ICaseService } from './case.service.interface'
import { CaseDto, CaseStatusDto } from './models'
import { CASE_RELATIONS } from './relations'

const LOGGING_CATEGORY = 'CaseService'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IApplicationService))
    private readonly applicationService: IApplicationService,

    @Inject(forwardRef(() => ICommentService))
    private readonly commentService: ICommentService,

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
        const nextCaseNumber = this.utilityService.generateCaseNumber()

        const departmentLookup = await this.utilityService.departmentLookup(
          application.answers.advert.department,
        )

        if (!departmentLookup.ok) {
          return departmentLookup
        }

        const newCase = await this.caseModel.create(
          {
            id: uuid(),
            applicationId: application.id,
            year: now.getFullYear(),
            caseNumber: nextCaseNumber,
            statusId: caseStatusLookup.value.id,
            tagId: caseTagLookup.value.id,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isLegacy: false,
            assignedUserId: null,
            communicationStatusId: caseCommunicationStatus.value.id,
            publishedAt: null,
            price: null,
            paid: false,
            fastTrack: application.answers.publishing?.fastTrack ?? false,
            departmentId: departmentLookup.value.id,
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
            state: JSON.stringify(application),
          },
          t,
        )

        const newCaseLookup = await this.utilityService.caseLookup(newCase.id)

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

      const cases = await this.caseModel.findAll({
        offset: (page - 1) * pageSize,
        limit: pageSize,
        where: whereParams,
        include: CASE_RELATIONS,
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

  publish(body: PostCasePublishBody): Promise<Result<undefined>> {
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
    return Promise.resolve({
      ok: true,
      value: undefined,
    })
  }
}
