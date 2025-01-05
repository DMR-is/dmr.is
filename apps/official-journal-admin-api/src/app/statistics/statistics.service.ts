import { Op, Sequelize } from 'sequelize'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertDepartmentModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
} from '@dmr.is/modules'
import {
  CaseCommunicationStatus,
  CaseStatusEnum,
  DepartmentSlugEnum,
} from '@dmr.is/shared/dto'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IStatisticsService } from './statistics.service.interface'

const LOGGING_CATEGORY = 'statistics-service'
const LOGGING_CONTEXT = 'StatisticsQueryRunner'

@Injectable()
export class StatisticsService implements IStatisticsService {
  private readonly availableStatuses = [
    CaseStatusEnum.Submitted,
    CaseStatusEnum.InProgress,
    CaseStatusEnum.InReview,
    CaseStatusEnum.ReadyForPublishing,
  ]
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseStatusModel)
    private readonly caseStatusModel: typeof CaseStatusModel,
  ) {}

  @LogAndHandle()
  async getDepartment(
    slug: DepartmentSlugEnum,
  ): Promise<ResultWrapper<GetStatisticsDepartmentResponse>> {
    const submittedCountQuery = this.caseModel.count({
      benchmark: true,
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.Submitted,
            },
          },
        },
        {
          model: AdvertDepartmentModel,
          where: {
            slug: {
              [Op.eq]: slug,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsForDepartment submitted count query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'getStatisticsForDepartment',
          },
        ),
    })

    const inProgressCountQuery = this.caseModel.count({
      benchmark: true,
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.InProgress,
            },
          },
        },
        {
          model: AdvertDepartmentModel,
          where: {
            slug: {
              [Op.eq]: slug,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsForDepartment in progress count query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'getStatisticsForDepartment',
          },
        ),
    })

    const inReviewCountQuery = this.caseModel.count({
      benchmark: true,
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.InReview,
            },
          },
        },
        {
          model: AdvertDepartmentModel,
          where: {
            slug: {
              [Op.eq]: slug,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsForDepartment in review count query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'getStatisticsForDepartment',
          },
        ),
    })

    const readyForPublishingCountQuery = this.caseModel.count({
      benchmark: true,
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.ReadyForPublishing,
            },
          },
        },
        {
          model: AdvertDepartmentModel,
          where: {
            slug: {
              [Op.eq]: slug,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsForDepartment ready for publishing count query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'getStatisticsForDepartment',
          },
        ),
    })

    const [
      submittedCount,
      inProgressCount,
      inReviewCount,
      readyForPublishingCount,
    ] = await Promise.all([
      submittedCountQuery,
      inProgressCountQuery,
      inReviewCountQuery,
      readyForPublishingCountQuery,
    ])

    const total =
      submittedCount + inProgressCount + inReviewCount + readyForPublishingCount

    const results = {
      total: total,
      statuses: [
        {
          title: CaseStatusEnum.Submitted,
          count: submittedCount,
          percentage: total ? (submittedCount / total) * 100 : 0,
        },
        {
          title: CaseStatusEnum.InProgress,
          count: inProgressCount,
          percentage: total ? (inProgressCount / total) * 100 : 0,
        },
        {
          title: CaseStatusEnum.InReview,
          count: inReviewCount,
          percentage: total ? (inReviewCount / total) * 100 : 0,
        },
        {
          title: CaseStatusEnum.ReadyForPublishing,
          count: readyForPublishingCount,
          percentage: total ? (readyForPublishingCount / total) * 100 : 0,
        },
      ],
    }

    return ResultWrapper.ok(results)
  }

  @LogAndHandle()
  async getOverview(
    type: StatisticsOverviewQueryType,
    userId?: string,
  ): Promise<ResultWrapper<GetStatisticsOverviewResponse>> {
    const personal = type === StatisticsOverviewQueryType.Personal && userId

    switch (type) {
      case StatisticsOverviewQueryType.General:
        return this.getGeneralOverviewCount()
      case StatisticsOverviewQueryType.Personal:
        if (!personal) {
          this.logger.warn(
            'Personal statstic overview requested without userId',
            LOGGING_CONTEXT,
          )
          return ResultWrapper.err({
            code: 400,
            message: 'No userId provided for personal overview',
          })
        }
        return this.getPersonalOverviewCount(userId)
      case StatisticsOverviewQueryType.Inactive:
        return this.getInactiveOverviewCount()
      case StatisticsOverviewQueryType.Publishing:
        return this.getPublishingOverviewCount()
      default:
        return this.getGeneralOverviewCount()
    }
  }

  @LogAndHandle()
  private async getGeneralOverviewCount(): Promise<
    ResultWrapper<GetStatisticsOverviewResponse>
  > {
    const unassignedQuery = this.caseModel.count({
      benchmark: true,
      where: {
        assignedUserId: {
          [Op.eq]: null,
        },
      },
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.Submitted,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview unassigned cases query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'unassignedCases',
          },
        ),
    })

    const recentActivityQuery = this.caseModel.count({
      benchmark: true,
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.in]: this.availableStatuses,
            },
          },
        },
        {
          model: CaseCommunicationStatusModel,
          where: {
            title: {
              [Op.eq]: CaseCommunicationStatus.HasAnswers,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview recent activity query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'recentActivity',
          },
        ),
    })

    const submittedFasttrackQuery = this.caseModel.count({
      benchmark: true,
      where: {
        fastTrack: {
          [Op.eq]: true,
        },
      },
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.Submitted,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview submitted fast track query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'fasttrackCases',
          },
        ),
    })

    const inReviewFasttrackQuery = this.caseModel.count({
      benchmark: true,
      where: {
        fastTrack: {
          [Op.eq]: true,
        },
      },
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.InReview,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview in review fast track query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'fasttrackCasesInReview',
          },
        ),
    })

    const [
      unassignedCount,
      recentActivityCount,
      submittedFastCount,
      inreviewFastCount,
    ] = await Promise.all([
      unassignedQuery,
      recentActivityQuery,
      submittedFasttrackQuery,
      inReviewFasttrackQuery,
    ])

    const result: GetStatisticsOverviewResponse = {
      categories: [
        {
          text:
            unassignedCount === 1
              ? `${unassignedCount} innsent mál bíða úthlutunar`
              : `${unassignedCount} innsend mál bíða úthlutunar`,
          count: unassignedCount,
        },
        {
          text:
            recentActivityCount === 1
              ? `Borist hafa ný svör í ${recentActivityCount} máli`
              : `Borist hafa ný svör í ${recentActivityCount} málum`,
          count: recentActivityCount,
        },
        {
          text:
            submittedFastCount === 1
              ? `${submittedFastCount} innsent mál er með ósk um hraðbirtingu`
              : `${submittedFastCount} innsend mál eru með ósk um hraðbirtingu`,
          count: submittedFastCount,
        },
        {
          text:
            inreviewFastCount === 1
              ? `${inreviewFastCount} mál í yfirlestri er með ósk um hraðbirtingu`
              : `${inreviewFastCount} mál í yfirlestri eru með ósk um hraðbirtingu`,
          count: inreviewFastCount,
        },
      ],
      total:
        unassignedCount +
        recentActivityCount +
        submittedFastCount +
        inreviewFastCount,
    }

    return ResultWrapper.ok(result)
  }

  @LogAndHandle()
  private async getPersonalOverviewCount(
    userId: string,
  ): Promise<ResultWrapper<GetStatisticsOverviewResponse>> {
    const personalCount = await this.caseModel.count({
      benchmark: true,
      where: {
        assignedUserId: {
          [Op.eq]: userId,
        },
      },
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.in]: this.availableStatuses,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview unassigned cases query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'personalCases',
          },
        ),
    })

    const result: GetStatisticsOverviewResponse = {
      categories: [
        {
          text:
            personalCount === 1
              ? `${personalCount} mál er skráð á mig`
              : `${personalCount} mál eru skráð á mig`,
          count: personalCount,
        },
      ],
      total: personalCount,
    }

    return ResultWrapper.ok(result)
  }

  @LogAndHandle()
  private async getInactiveOverviewCount(): Promise<
    ResultWrapper<GetStatisticsOverviewResponse>
  > {
    const limit = new Date()
    limit.setDate(limit.getDate() - 5)

    const inactiveCount = await this.caseModel.count({
      benchmark: true,
      where: {
        updatedAt: {
          [Op.lt]: limit,
        },
      },
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.in]: this.availableStatuses,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview inactive cases query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'inactiveCases',
          },
        ),
    })

    const result: GetStatisticsOverviewResponse = {
      categories: [
        {
          text:
            inactiveCount === 1
              ? `${inactiveCount} mál hefur ekki verið hreyft í meira en 5 daga`
              : `${inactiveCount} mál hafa ekki verið hreyfð í meira en 5 daga`,
          count: inactiveCount,
        },
      ],
      total: inactiveCount,
    }

    return ResultWrapper.ok(result)
  }

  @LogAndHandle()
  private async getPublishingOverviewCount(): Promise<
    ResultWrapper<GetStatisticsOverviewResponse>
  > {
    const today = new Date()

    const todayCount = this.caseModel.count({
      benchmark: true,
      where: {
        requestedPublicationDate: {
          [Op.eq]: today,
        },
      },
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.ReadyForPublishing,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview todays publishing query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'todayPublishing',
          },
        ),
    })

    const pastDueCount = this.caseModel.count({
      benchmark: true,
      where: {
        requestedPublicationDate: {
          [Op.lt]: today,
        },
      },
      include: [
        {
          model: CaseStatusModel,
          where: {
            title: {
              [Op.eq]: CaseStatusEnum.InReview,
            },
          },
        },
      ],
      logging: (_, timing) =>
        this.logger.info(
          `getStatisticsOverview past due publishing query ran in ${timing}ms`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            query: 'pastDuePublishing',
          },
        ),
    })

    const [todayPublishingCount, pastDuePublishingCount] = await Promise.all([
      todayCount,
      pastDueCount,
    ])

    const result: GetStatisticsOverviewResponse = {
      categories: [
        {
          text:
            todayPublishingCount === 1
              ? `${todayPublishingCount} tilbúið mál eru áætlað til útgáfu í dag.`
              : `${todayPublishingCount} tilbúin mál eru áætluð til útgáfu í dag.`,
          count: todayPublishingCount,
        },
        {
          text:
            pastDuePublishingCount === 1
              ? `${pastDuePublishingCount} mál í yfirlestri er með liðinn birtingardag.`
              : `${pastDuePublishingCount} mál í yfirlestri eru með liðinn birtingardag.`,
          count: pastDuePublishingCount,
        },
      ],
      total: todayPublishingCount + pastDuePublishingCount,
    }

    return ResultWrapper.ok(result)
  }
}
