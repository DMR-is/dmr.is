import { Op, Sequelize } from 'sequelize'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertDepartmentModel,
  CaseModel,
  CaseStatusModel,
} from '@dmr.is/modules'
import { CaseStatusEnum, DepartmentSlugEnum } from '@dmr.is/shared/dto'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable, NotImplementedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IStatisticsService } from './statistics.service.interface'

const LOGGING_CATEGORY = 'statistics-service'
const LOGGING_CONTEXT = 'StatisticsQueryRunner'

type DepartmentCounterResult = {
  status: {
    id: string
    title: CaseStatusEnum
    slug: string
  }
  count: string
}

@Injectable()
export class StatisticsService implements IStatisticsService {
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
    const availableStatuses = [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
    ]

    const counterResults = (await this.caseStatusModel.findAll({
      benchmark: true,
      raw: true,
      nest: true,
      attributes: [
        [Sequelize.col('CaseStatusModel.id'), 'status.id'],
        [Sequelize.col('CaseStatusModel.title'), 'status.title'],
        [Sequelize.col('CaseStatusModel.slug'), 'status.slug'],
        [Sequelize.fn('COUNT', Sequelize.col('cases.id')), 'count'],
      ],
      where: {
        title: {
          [Op.in]: availableStatuses,
        },
      },
      include: [
        {
          model: CaseModel,
          required: false,
          attributes: [],
          include: [
            {
              model: AdvertDepartmentModel,
              required: true,
              attributes: [],
              where: {
                slug: {
                  [Op.eq]: slug,
                },
              },
            },
          ],
        },
      ],
      group: ['CaseStatusModel.id', 'cases.department.id'],
      logging: (_, timing) =>
        this.logger.info(`getStatisticsForDepartment ran in ${timing}ms`, {
          context: LOGGING_CONTEXT,
          category: LOGGING_CATEGORY,
          query: 'getStatisticsForDepartment',
        }),
    })) as unknown as DepartmentCounterResult[]

    const total = counterResults.reduce((acc, curr) => {
      return acc + parseInt(curr.count)
    }, 0)

    const results: GetStatisticsDepartmentResponse = {
      total,
      statuses: counterResults.map((counter) => ({
        status: {
          id: counter.status.id,
          title: counter.status.title,
          slug: counter.status.slug,
        },
        count: parseInt(counter.count),
        percentage: Math.round((parseInt(counter.count) / total) * 100),
      })),
    }

    return ResultWrapper.ok(results)
  }

  @LogAndHandle()
  async getOverview(
    type: StatisticsOverviewQueryType,
    userId?: string,
  ): Promise<ResultWrapper<GetStatisticsOverviewResponse>> {
    throw new NotImplementedException()

    // const casesRes = (
    //   await this.casesService.getCases({
    //     pageSize: '1000',
    //     year: new Date().getFullYear().toString(),
    //     status: [
    //       CaseStatusEnum.Submitted,
    //       CaseStatusEnum.InProgress,
    //       CaseStatusEnum.InReview,
    //       CaseStatusEnum.ReadyForPublishing,
    //     ],
    //   })
    // ).unwrap()

    // const cases = casesRes.cases

    // const categories: StatisticsOverviewCategory[] = []
    // const totalCases = 0

    // if (type === StatisticsOverviewQueryType.General) {
    //   let submittedCount = 0
    //   let inProgressCount = 0
    //   let submittedFastTrack = 0
    //   let inReviewFastTrack = 0

    //   // fast track functionality is not implemented yet

    //   cases.forEach((thisCase) => {
    //     if (thisCase.status.title === CaseStatusEnum.Submitted) {
    //       submittedCount++
    //     }

    //     if (
    //       [CaseStatusEnum.InProgress, CaseStatusEnum.InReview].includes(
    //         thisCase.status.title as CaseStatusEnum,
    //       )
    //     ) {
    //       inProgressCount++
    //     }

    //     if (
    //       thisCase.fastTrack &&
    //       thisCase.status.title !== CaseStatusEnum.ReadyForPublishing
    //     ) {
    //       submittedFastTrack++
    //     }

    //     if (
    //       thisCase.fastTrack &&
    //       thisCase.status.title === CaseStatusEnum.ReadyForPublishing
    //     ) {
    //       inReviewFastTrack++
    //     }
    //   })

    //   if (submittedCount) {
    //     categories.push({
    //       text: isSingular(submittedCount)
    //         ? `${submittedCount} innsent mál bíður úthlutunar.`
    //         : `${submittedCount} innsend mál bíða úthlutunar.`,
    //       totalCases: submittedCount,
    //     })
    //   }

    //   if (inProgressCount) {
    //     categories.push({
    //       text: isSingular(inProgressCount)
    //         ? `${inProgressCount} mál er í vinnslu.`
    //         : `${inProgressCount} mál eru í vinnslu.`,
    //       totalCases: inProgressCount,
    //     })
    //   }

    //   if (submittedFastTrack) {
    //     categories.push({
    //       text: isSingular(submittedFastTrack)
    //         ? `${submittedFastTrack} innsent mál er með ósk um hraðbirtingu.`
    //         : `${submittedFastTrack} innsend mál eru með ósk um hraðbirtingu.`,
    //       totalCases: submittedFastTrack,
    //     })
    //   }

    //   if (inReviewFastTrack) {
    //     categories.push({
    //       text: isSingular(inReviewFastTrack)
    //         ? `${inReviewFastTrack} mál í yfirlestri er með ósk um hraðbirtingu.`
    //         : `${inReviewFastTrack} mál í yfirlestri eru með ósk um hraðbirtingu.`,
    //       totalCases: inReviewFastTrack,
    //     })
    //   }

    //   totalCases =
    //     submittedCount +
    //     inProgressCount +
    //     submittedFastTrack +
    //     inReviewFastTrack
    // }

    // if (type === StatisticsOverviewQueryType.Personal && userId) {
    //   const myCases = cases.filter((c) => c.assignedTo?.id === userId)
    //   const myCasesCount = myCases.length

    //   if (myCasesCount) {
    //     categories.push({
    //       text: isSingular(myCasesCount)
    //         ? `${myCasesCount} mál er skráð á mig.`
    //         : `${myCasesCount} mál eru skráð á mig.`,
    //       totalCases: myCasesCount,
    //     })
    //   }

    //   totalCases = myCasesCount
    // }

    // if (type === StatisticsOverviewQueryType.Inactive) {
    //   const limit = new Date()
    //   limit.setDate(-6)

    //   const inactiveCases = cases.filter(
    //     (c) =>
    //       [
    //         CaseStatusEnum.Submitted,
    //         CaseStatusEnum.InProgress,
    //         CaseStatusEnum.InReview,
    //       ].includes(c.status.title as CaseStatusEnum) &&
    //       new Date(c.modifiedAt) < limit,
    //   )
    //   const inactiveCasesCount = inactiveCases.length

    //   if (inactiveCasesCount) {
    //     categories.push({
    //       text: isSingular(inactiveCasesCount)
    //         ? `${inactiveCasesCount} mál hefur ekki verið hreyft í meira en 5 daga.`
    //         : `${inactiveCasesCount} mál hafa ekki verið hreyfð í meira en 5 daga.`,
    //       totalCases: inactiveCasesCount,
    //     })
    //   }
    //   totalCases = inactiveCasesCount
    // }

    // if (type === StatisticsOverviewQueryType.Publishing) {
    //   const today = new Date()
    //   let todayCount = 0
    //   let pastDueCount = 0

    //   cases.forEach((thisCase) => {
    //     if (
    //       thisCase.requestedPublicationDate &&
    //       new Date(thisCase.requestedPublicationDate) === today &&
    //       thisCase.status.title === CaseStatusEnum.ReadyForPublishing
    //     ) {
    //       todayCount++
    //     }

    //     if (
    //       thisCase.requestedPublicationDate &&
    //       new Date(thisCase.requestedPublicationDate) < today &&
    //       thisCase.status.title === CaseStatusEnum.ReadyForPublishing
    //     ) {
    //       pastDueCount++
    //     }
    //   })

    //   if (todayCount) {
    //     categories.push({
    //       text: isSingular(todayCount)
    //         ? `${todayCount} tilbúið mál er áætlað til útgáfu í dag.`
    //         : `${todayCount} tilbúin mál eru áætluð til útgáfu í dag.`,
    //       totalCases: todayCount,
    //     })
    //   }

    //   if (pastDueCount) {
    //     categories.push({
    //       text: isSingular(pastDueCount)
    //         ? `${pastDueCount} mál í yfirlestri er með liðinn birtingardag.`
    //         : `${pastDueCount} mál í yfirlestri eru með liðinn birtingardag.`,
    //       totalCases: pastDueCount,
    //     })
    //   }
    //   totalCases = todayCount + pastDueCount
    // }
  }
}
