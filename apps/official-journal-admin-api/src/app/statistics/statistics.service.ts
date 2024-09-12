import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ICaseService, IUtilityService } from '@dmr.is/modules'
import { CaseStatus } from '@dmr.is/shared/dto'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewCategory,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { isSingular } from '@dmr.is/utils/client'

import { forwardRef, Inject, Injectable } from '@nestjs/common'

import { IStatisticsService } from './statistics.service.interface'

@Injectable()
export class StatisticsService implements IStatisticsService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => ICaseService))
    private readonly casesService: ICaseService,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
  ) {
    this.logger.info('Using StatisticsService')
  }

  @LogAndHandle()
  async getDepartment(
    slug: string,
  ): Promise<ResultWrapper<GetStatisticsDepartmentResponse>> {
    const casesRes = (
      await this.casesService.getCases({
        pageSize: '1000',
        department: [slug],
        status: [
          CaseStatus.Submitted,
          CaseStatus.InProgress,
          CaseStatus.InReview,
          CaseStatus.ReadyForPublishing,
        ],
      })
    ).unwrap()
    const cases = casesRes.cases

    let submitted = 0
    let inProgress = 0
    let inReview = 0
    let ready = 0

    cases.forEach((thisCase) => {
      switch (thisCase.status) {
        case CaseStatus.Submitted:
          submitted++
          break
        case CaseStatus.InProgress:
          inProgress++
          break
        case CaseStatus.InReview:
          inReview++
          break
        case CaseStatus.ReadyForPublishing:
          ready++
          break
      }
    })

    const total = submitted + inProgress + inReview + ready
    const submittedPercentage = total ? (submitted / total) * 100 : 0
    const inProgressPercentage = total ? (inProgress / total) * 100 : 0
    const inReviewPercentage = total ? (inReview / total) * 100 : 0
    const readyPercentage = total ? (ready / total) * 100 : 0

    return ResultWrapper.ok({
      data: {
        submitted: {
          name: CaseStatus.Submitted,
          count: submitted,
          percentage: Math.round(submittedPercentage),
        },
        inProgress: {
          name: CaseStatus.InProgress,
          count: inProgress,
          percentage: Math.round(inProgressPercentage),
        },
        inReview: {
          name: CaseStatus.InReview,
          count: inReview,
          percentage: Math.round(inReviewPercentage),
        },
        ready: {
          name: CaseStatus.ReadyForPublishing,
          count: ready,
          percentage: Math.round(readyPercentage),
        },
      },
      totalCases: total,
    })
  }

  @LogAndHandle()
  async getOverview(
    type: StatisticsOverviewQueryType,
    userId?: string,
  ): Promise<ResultWrapper<GetStatisticsOverviewResponse>> {
    console.log('yehaw')
    const casesRes = (
      await this.casesService.getCases({
        pageSize: '1000',
        status: [
          CaseStatus.Submitted,
          CaseStatus.InProgress,
          CaseStatus.InReview,
          CaseStatus.ReadyForPublishing,
        ],
      })
    ).unwrap()

    const cases = casesRes.cases

    const categories: StatisticsOverviewCategory[] = []
    let totalCases = 0

    if (type === StatisticsOverviewQueryType.General) {
      let submittedCount = 0
      let inProgressCount = 0
      let submittedFastTrack = 0
      let inReviewFastTrack = 0

      // fast track functionality is not implemented yet

      cases.forEach((thisCase) => {
        if (thisCase.status === CaseStatus.Submitted) {
          submittedCount++
        }

        if (
          [CaseStatus.InProgress, CaseStatus.InReview].includes(thisCase.status)
        ) {
          inProgressCount++
        }

        if (
          thisCase.fastTrack &&
          thisCase.status !== CaseStatus.ReadyForPublishing
        ) {
          submittedFastTrack++
        }

        if (
          thisCase.fastTrack &&
          thisCase.status === CaseStatus.ReadyForPublishing
        ) {
          inReviewFastTrack++
        }
      })

      if (submittedCount) {
        categories.push({
          text: isSingular(submittedCount)
            ? `${submittedCount} innsent mál bíður úthlutunar.`
            : `${submittedCount} innsend mál bíða úthlutunar.`,
          totalCases: submittedCount,
        })
      }

      if (inProgressCount) {
        categories.push({
          text: isSingular(inProgressCount)
            ? `${inProgressCount} mál er í vinnslu.`
            : `${inProgressCount} mál eru í vinnslu.`,
          totalCases: inProgressCount,
        })
      }

      if (submittedFastTrack) {
        categories.push({
          text: isSingular(submittedFastTrack)
            ? `${submittedFastTrack} innsent mál er með ósk um hraðbirtingu.`
            : `${submittedFastTrack} innsend mál eru með ósk um hraðbirtingu.`,
          totalCases: submittedFastTrack,
        })
      }

      if (inReviewFastTrack) {
        categories.push({
          text: isSingular(inReviewFastTrack)
            ? `${inReviewFastTrack} mál í yfirlestri er með ósk um hraðbirtingu.`
            : `${inReviewFastTrack} mál í yfirlestri eru með ósk um hraðbirtingu.`,
          totalCases: inReviewFastTrack,
        })
      }

      totalCases =
        submittedCount +
        inProgressCount +
        submittedFastTrack +
        inReviewFastTrack
    }

    if (type === StatisticsOverviewQueryType.Personal && userId) {
      const myCases = cases.filter((c) => c.assignedTo?.id === userId)
      const myCasesCount = myCases.length

      if (myCasesCount) {
        categories.push({
          text: isSingular(myCasesCount)
            ? `${myCasesCount} mál er skráð á mig.`
            : `${myCasesCount} mál eru skráð á mig.`,
          totalCases: myCasesCount,
        })
      }

      totalCases = myCasesCount
    }

    if (type === StatisticsOverviewQueryType.Inactive) {
      const limit = new Date()
      limit.setDate(-6)

      const inactiveCases = cases.filter(
        (c) =>
          [
            CaseStatus.Submitted,
            CaseStatus.InProgress,
            CaseStatus.InReview,
          ].includes(c.status) && new Date(c.modifiedAt) < limit,
      )
      const inactiveCasesCount = inactiveCases.length

      if (inactiveCasesCount) {
        categories.push({
          text: isSingular(inactiveCasesCount)
            ? `${inactiveCasesCount} mál hefur ekki verið hreyft í meira en 5 daga.`
            : `${inactiveCasesCount} mál hafa ekki verið hreyfð í meira en 5 daga.`,
          totalCases: inactiveCasesCount,
        })
      }
      totalCases = inactiveCasesCount
    }

    if (type === StatisticsOverviewQueryType.Publishing) {
      const today = new Date()
      let todayCount = 0
      let pastDueCount = 0

      cases.forEach((thisCase) => {
        if (
          thisCase.requestedPublicationDate &&
          new Date(thisCase.requestedPublicationDate) === today &&
          thisCase.status === CaseStatus.ReadyForPublishing
        ) {
          todayCount++
        }

        if (
          thisCase.requestedPublicationDate &&
          new Date(thisCase.requestedPublicationDate) < today &&
          thisCase.status === CaseStatus.ReadyForPublishing
        ) {
          pastDueCount++
        }
      })

      if (todayCount) {
        categories.push({
          text: isSingular(todayCount)
            ? `${todayCount} tilbúið mál er áætlað til útgáfu í dag.`
            : `${todayCount} tilbúin mál eru áætluð til útgáfu í dag.`,
          totalCases: todayCount,
        })
      }

      if (pastDueCount) {
        categories.push({
          text: isSingular(pastDueCount)
            ? `${pastDueCount} mál í yfirlestri er með liðinn birtingardag.`
            : `${pastDueCount} mál í yfirlestri eru með liðinn birtingardag.`,
          totalCases: pastDueCount,
        })
      }
      totalCases = todayCount + pastDueCount
    }

    return ResultWrapper.ok({
      categories,
      totalCases,
    })
  }
}
