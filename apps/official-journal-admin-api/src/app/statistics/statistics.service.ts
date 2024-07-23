import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ALL_MOCK_ADVERTS } from '@dmr.is/mocks'
import { ICaseService } from '@dmr.is/modules'
import { AdvertStatus, CaseStatus } from '@dmr.is/shared/dto'
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewCategory,
  StatisticsOverviewQueryType,
} from '@dmr.is/shared/dto'
import { isSingular } from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common'

import { IStatisticsService } from './statistics.service.interface'

@Injectable()
export class StatisticsService implements IStatisticsService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => ICaseService))
    private readonly casesService: ICaseService,
  ) {
    this.logger.info('Using StatisticsService')
  }

  async getDepartment(id: string): Promise<GetStatisticsDepartmentResponse> {
    if (!id) {
      throw new BadRequestException('Missing parameters')
    }

    const statuses = [
      AdvertStatus.Submitted,
      AdvertStatus.InProgress,
      AdvertStatus.Active,
      AdvertStatus.ReadyForPublication,
    ]

    const adverts = ALL_MOCK_ADVERTS.filter(
      (advert) =>
        advert?.department?.id === id &&
        advert.status &&
        statuses.includes(advert.status),
    )

    let submitted = 0
    let inProgress = 0
    let inReview = 0
    let ready = 0

    adverts.forEach((advert) => {
      switch (advert.status) {
        case AdvertStatus.Submitted:
          submitted++
          break
        case AdvertStatus.InProgress:
          inProgress++
          break
        case AdvertStatus.Active:
          inReview++
          break
        case AdvertStatus.ReadyForPublication:
          ready++
          break
      }
    })

    const total = submitted + inProgress + inReview + ready
    const submittedPercentage = total ? (submitted / total) * 100 : 0
    const inProgressPercentage = total ? (inProgress / total) * 100 : 0
    const inReviewPercentage = total ? (inReview / total) * 100 : 0
    const readyPercentage = total ? (ready / total) * 100 : 0

    return Promise.resolve({
      submitted: {
        name: 'Innsendingar',
        count: submitted,
        percentage: Math.round(submittedPercentage),
      },
      inProgress: {
        name: 'Grunnvinnsla',
        count: inProgress,
        percentage: Math.round(inProgressPercentage),
      },
      inReview: {
        name: 'Yfirlestur',
        count: inReview,
        percentage: Math.round(inReviewPercentage),
      },
      ready: {
        name: 'Tilbúið',
        count: ready,
        percentage: Math.round(readyPercentage),
      },
      totalAdverts: total,
      totalPercentage: 100,
    })
  }

  async getOverview(
    type: string,
    userId?: string,
  ): Promise<GetStatisticsOverviewResponse> {
    if (!type) {
      throw new BadRequestException('Missing parameters')
    }

    // check if type is in enum
    if (!Object.values<string>(StatisticsOverviewQueryType).includes(type)) {
      throw new BadRequestException('Invalid type')
    }

    const casesRes = (
      await this.casesService.cases({ published: 'false', pageSize: '1000' })
    ).unwrap()
    const cases = casesRes.cases

    const categories: StatisticsOverviewCategory[] = []
    let totalAdverts = 0

    if (!cases.length) {
      return Promise.resolve({
        categories,
        totalAdverts,
      })
    }

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
          totalAdverts: submittedCount,
        })
      }

      if (inProgressCount) {
        categories.push({
          text: isSingular(inProgressCount)
            ? `${inProgressCount} mál er í vinnslu.`
            : `${inProgressCount} mál eru í vinnslu.`,
          totalAdverts: inProgressCount,
        })
      }

      if (submittedFastTrack) {
        categories.push({
          text: isSingular(submittedFastTrack)
            ? `${submittedFastTrack} innsent mál er með ósk um hraðbirtingu.`
            : `${submittedFastTrack} innsend mál eru með ósk um hraðbirtingu.`,
          totalAdverts: submittedFastTrack,
        })
      }

      if (inReviewFastTrack) {
        categories.push({
          text: isSingular(inReviewFastTrack)
            ? `${inReviewFastTrack} mál í yfirlestri er með ósk um hraðbirtingu.`
            : `${inReviewFastTrack} mál í yfirlestri eru með ósk um hraðbirtingu.`,
          totalAdverts: inReviewFastTrack,
        })
      }

      totalAdverts =
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
          totalAdverts: myCasesCount,
        })
      }

      totalAdverts = myCasesCount
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
          totalAdverts: inactiveCasesCount,
        })
      }
      totalAdverts = inactiveCasesCount
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
          totalAdverts: todayCount,
        })
      }

      if (pastDueCount) {
        categories.push({
          text: isSingular(pastDueCount)
            ? `${pastDueCount} mál í yfirlestri er með liðinn birtingardag.`
            : `${pastDueCount} mál í yfirlestri eru með liðinn birtingardag.`,
          totalAdverts: pastDueCount,
        })
      }
      totalAdverts = todayCount + pastDueCount
    }

    return Promise.resolve({
      categories: categories,
      totalAdverts: totalAdverts,
    })
  }
}
