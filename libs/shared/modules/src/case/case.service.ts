import { Op } from 'sequelize'
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

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { caseParameters, counterResult, statusResMapper } from '../helpers'
import { caseMigrate } from '../helpers/migrations/case/case-migrate'
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
  ): Promise<CaseEditorialOverview> {
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

      return Promise.resolve({
        data: res.cases,
        paging: res.paging,
        totalItems: counterResult(counter),
      })
    } catch (e) {
      throw new Error(JSON.stringify(e))
    }
  }

  async create(body: PostApplicationBody): Promise<CreateCaseResponse> {
    try {
      this.logger.info('Creating case', {
        applicationId: body.applicationId,
        category: LOGGING_CATEGORY,
      })

      const newCase = await this.sequelize.transaction(async (t) => {
        // check if case with application id already exists

        const existingCase = await this.caseModel.findOne({
          where: {
            applicationId: body.applicationId,
          },
        })

        if (existingCase) {
          throw new BadRequestException(
            'Case with application id already exists',
          )
        }

        const applicationResponse =
          await this.applicationService.getApplication(body.applicationId)

        if (!applicationResponse.ok) {
          throw new NotFoundException('Application not found')
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
          throw new NotFoundException('Case status not found')
        }

        const caseTag = await this.caseTagModel.findOne({
          transaction: t,
          where: {
            value: CaseTag.NotStarted,
          },
        })

        if (!caseTag) {
          throw new NotFoundException('Case tag not found')
        }

        const caseCommunicationStatus =
          await this.caseCommunicationStatusModel.findOne({
            transaction: t,
            where: {
              value: CaseCommunicationStatus.NotStarted,
            },
          })

        if (!caseCommunicationStatus) {
          throw new NotFoundException('Case communication status not found')
        }

        const department = await this.departmentModel.findByPk(
          application.answers.advert.department,
          {
            transaction: t,
          },
        )

        if (!department) {
          throw new NotFoundException('Department not found')
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
            departmentId: department,
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
          throw new InternalServerErrorException('Failed to create case')
        }

        return caseMigrate(activeCase)
      })

      return Promise.resolve({
        case: newCase,
      })
    } catch (error) {
      this.logger.error('Error in createCase', {
        error,
        category: LOGGING_CATEGORY,
      })
      throw new InternalServerErrorException('Internal server error.')
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

  async cases(params: GetCasesQuery): Promise<GetCasesReponse> {
    try {
      this.logger.info('Getting cases', {
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
        cases: cases.map(caseMigrate),
        paging: generatePaging(cases, page, pageSize),
      })
    } catch (error) {
      this.logger.error('Error in getCases', {
        category: LOGGING_CATEGORY,
        error,
      })
      throw new InternalServerErrorException('Failed to get cases')
    }
  }

  publish(body: PostCasePublishBody): Promise<void> {
    const { caseIds } = body

    return Promise.resolve()
  }
}
