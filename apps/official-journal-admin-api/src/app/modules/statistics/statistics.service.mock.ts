import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertStatusEnum,
  CaseStatusEnum,
} from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common'

import { GetStatisticsDepartmentResponse } from './dto/statistics-department.dto'
import { StatisticsOverviewQueryType } from './dto/statistics-overview-constants.dto'
import {
  GetStatisticOverviewDashboardResponse,
  GetStatisticsOverviewResponse,
  StatisticsOverviewCategory,
} from './dto/statistics-overview-dto'
import { IStatisticsService } from './statistics.service.interface'

@Injectable()
export class MockStatisticsService implements IStatisticsService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using StatisticsServiceMock')
  }
  getDepartment(
    id: string,
  ): Promise<ResultWrapper<GetStatisticsDepartmentResponse>> {
    const statuses = [
      AdvertStatusEnum.Submitted,
      AdvertStatusEnum.InProgress,
      AdvertStatusEnum.Active,
      AdvertStatusEnum.ReadyForPublication,
    ]

    const adverts = [ALL_MOCK_ADVERTS].filter(
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
        case AdvertStatusEnum.Submitted:
          submitted++
          break
        case AdvertStatusEnum.InProgress:
          inProgress++
          break
        case AdvertStatusEnum.Active:
          inReview++
          break
        case AdvertStatusEnum.ReadyForPublication:
          ready++
          break
      }
    })

    const total = submitted + inProgress + inReview + ready
    const submittedPercentage = total ? (submitted / total) * 100 : 0
    const inProgressPercentage = total ? (inProgress / total) * 100 : 0
    const inReviewPercentage = total ? (inReview / total) * 100 : 0
    const readyPercentage = total ? (ready / total) * 100 : 0

    // @ts-expect-error FIXME: weird error
    return ResultWrapper.ok({
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
      total: total,
    })
  }

  async getOverviewForDashboard(
    _userId: string,
  ): Promise<ResultWrapper<GetStatisticOverviewDashboardResponse>> {
    throw new NotImplementedException()
  }

  getOverview(
    type: string,
  ): Promise<ResultWrapper<GetStatisticsOverviewResponse>> {
    // check if type is in enum
    if (!Object.values<string>(StatisticsOverviewQueryType).includes(type)) {
      throw new BadRequestException('Invalid type')
    }

    let categories: StatisticsOverviewCategory[] = []
    let totalCases = 0

    if (type === StatisticsOverviewQueryType.General) {
      let submitted = 0
      let inProgress = 0
      // let submittedFastTrack = 0
      // let inReviewFastTrack = 0

      // fast track functionality is not implemented yet

      const adverts = ALL_MOCK_ADVERTS.filter((advert) => {
        if (advert.status === AdvertStatusEnum.Submitted) {
          submitted++
        }

        if (advert.status === AdvertStatusEnum.InProgress) {
          inProgress++
        }

        // if(advert.status === JournalAdvertStatusEnum.Active) {
        //   submittedFastTrack++
        // }

        // if(advert.status === JournalAdvertStatusEnum.ReadyForPublication) {
        //   inReviewFastTrack++
        // }
      })

      categories = [
        {
          text: `${adverts.length} innsend mál bíða úthlutunar`,
          count: submitted,
        },
        {
          text: `Borist hafa ný svör í ${inProgress} málum`,
          count: inProgress,
        },
      ]
      totalCases = adverts.length
    }

    if (type === StatisticsOverviewQueryType.Personal) {
      throw new NotImplementedException()
    }

    if (type === StatisticsOverviewQueryType.Inactive) {
      throw new NotImplementedException()
    }

    if (type === StatisticsOverviewQueryType.Publishing) {
      let today = 0
      let pastDue = 0

      const adverts = ALL_MOCK_ADVERTS.filter((advert) => {
        if (advert.status === AdvertStatusEnum.ReadyForPublication) {
          today++
        }

        if (
          advert.publicationDate &&
          new Date(advert.publicationDate) < new Date() &&
          advert.status === AdvertStatusEnum.ReadyForPublication
        ) {
          pastDue++
        }
      })

      categories = [
        {
          text: `${today} tilbúin mál eru áætluð til útgáfu í dag.`,
          count: today,
        },
        {
          text: `${pastDue} mál í yfirlestri eru með liðinn birtingardag.`,
          count: pastDue,
        },
      ]
      totalCases = adverts.length
    }

    // @ts-expect-error FIXME: weird error
    return ResultWrapper.ok({
      categories: categories,
      total: totalCases,
    })
  }
}
