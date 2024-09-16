import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ICaseService, IUtilityService } from '@dmr.is/modules'
import { CaseStatusEnum } from '@dmr.is/shared/dto'
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
          CaseStatusEnum.Submitted,
          CaseStatusEnum.InProgress,
          CaseStatusEnum.InReview,
          CaseStatusEnum.ReadyForPublishing,
        ],
      })
    ).unwrap()
    const cases = casesRes.cases

    let submitted = 0
    let inProgress = 0
    let inReview = 0
    let ready = 0

    cases.forEach((thisCase) => {
      switch (thisCase.status.title) {
        case CaseStatusEnum.Submitted:
          submitted++
          break
        case CaseStatusEnum.InProgress:
          inProgress++
          break
        case CaseStatusEnum.InReview:
          inReview++
          break
        case CaseStatusEnum.ReadyForPublishing:
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
          name: CaseStatusEnum.Submitted,
          count: submitted,
          percentage: Math.round(submittedPercentage),
        },
        inProgress: {
          name: CaseStatusEnum.InProgress,
          count: inProgress,
          percentage: Math.round(inProgressPercentage),
        },
        inReview: {
          name: CaseStatusEnum.InReview,
          count: inReview,
          percentage: Math.round(inReviewPercentage),
        },
        ready: {
          name: CaseStatusEnum.ReadyForPublishing,
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
    const casesRes = (
      await this.casesService.getCases({
        pageSize: '1000',
        status: [
          CaseStatusEnum.Submitted,
          CaseStatusEnum.InProgress,
          CaseStatusEnum.InReview,
          CaseStatusEnum.ReadyForPublishing,
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
        if (thisCase.status.title === CaseStatusEnum.Submitted) {
          submittedCount++
        }

        if (
          [CaseStatusEnum.InProgress, CaseStatusEnum.InReview].includes(
            thisCase.status.title as CaseStatusEnum,
          )
        ) {
          inProgressCount++
        }

        if (
          thisCase.fastTrack &&
          thisCase.status.title !== CaseStatusEnum.ReadyForPublishing
        ) {
          submittedFastTrack++
        }

        if (
          thisCase.fastTrack &&
          thisCase.status.title === CaseStatusEnum.ReadyForPublishing
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
            CaseStatusEnum.Submitted,
            CaseStatusEnum.InProgress,
            CaseStatusEnum.InReview,
          ].includes(c.status.title as CaseStatusEnum) &&
          new Date(c.modifiedAt) < limit,
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
          thisCase.status.title === CaseStatusEnum.ReadyForPublishing
        ) {
          todayCount++
        }

        if (
          thisCase.requestedPublicationDate &&
          new Date(thisCase.requestedPublicationDate) < today &&
          thisCase.status.title === CaseStatusEnum.ReadyForPublishing
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
