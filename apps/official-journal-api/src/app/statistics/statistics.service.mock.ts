/* eslint-disable no-case-declarations */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { StatisticsDepartmentQuery } from '../../dto/statistics/statistics-department-query.dto'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { ALL_MOCK_ADVERTS } from '../../mock/journal.mock'
import { JournalAdvertStatus } from '../../dto/journal-constants.dto'
import {
  StatisticsOverviewResponse,
  StatisticsOverviewCategory,
} from '../../dto/statistics/statistics-overview-dto'
import {
  StatisticsOverviewQuery,
  StatisticsOverviewQueryType,
} from '../../dto/statistics/statistics-overview-query.dto'

@Injectable()
export class MockStatisticsService implements IStatisticsService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using StatisticsServiceMock')
  }
  getDepartment(
    params?: StatisticsDepartmentQuery,
  ): Promise<StatisticsDepartmentResponse> {
    if (!params?.id) {
      throw new BadRequestException('Missing parameters')
    }

    const statuses = [
      JournalAdvertStatus.Submitted,
      JournalAdvertStatus.InProgress,
      JournalAdvertStatus.Active,
      JournalAdvertStatus.ReadyForPublication,
    ]

    const adverts = ALL_MOCK_ADVERTS.filter(
      (advert) =>
        advert.department.id === params.id && statuses.includes(advert.status),
    )

    let submitted = 0
    let inProgress = 0
    let inReview = 0
    let ready = 0

    adverts.forEach((advert) => {
      switch (advert.status) {
        case JournalAdvertStatus.Submitted:
          submitted++
          break
        case JournalAdvertStatus.InProgress:
          inProgress++
          break
        case JournalAdvertStatus.Active:
          inReview++
          break
        case JournalAdvertStatus.ReadyForPublication:
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

  getOverview(
    params?: StatisticsOverviewQuery,
  ): Promise<StatisticsOverviewResponse> {
    if (!params?.type) {
      throw new BadRequestException('Missing parameters')
    }
    let categories: StatisticsOverviewCategory[] = []
    let totalAdverts = 0

    if (params.type === StatisticsOverviewQueryType.General) {
      let submitted = 0
      let inProgress = 0
      // let submittedFastTrack = 0
      // let inReviewFastTrack = 0

      // fast track functionality is not implemented yet

      const adverts = ALL_MOCK_ADVERTS.filter((advert) => {
        if (advert.status === JournalAdvertStatus.Submitted) {
          submitted++
        }

        if (advert.status === JournalAdvertStatus.InProgress) {
          inProgress++
        }

        // if(advert.status === JournalAdvertStatus.Active) {
        //   submittedFastTrack++
        // }

        // if(advert.status === JournalAdvertStatus.ReadyForPublication) {
        //   inReviewFastTrack++
        // }
      })

      categories = [
        {
          text: `${adverts.length} innsend mál bíða úthlutunar`,
          totalAdverts: submitted,
        },
        {
          text: `Borist hafa ný svör í ${inProgress} málum`,
          totalAdverts: inProgress,
        },
      ]
      totalAdverts = adverts.length
    } else if (params.type === StatisticsOverviewQueryType.Personal) {
      throw new NotImplementedException()
    } else if (params.type === StatisticsOverviewQueryType.Inactive) {
      throw new NotImplementedException()
    } else if (params.type === StatisticsOverviewQueryType.Publishing) {
      let today = 0
      let pastDue = 0

      const adverts = ALL_MOCK_ADVERTS.filter((advert) => {
        if (advert.status === JournalAdvertStatus.ReadyForPublication) {
          today++
        }

        if (
          advert.publicationDate &&
          new Date(advert.publicationDate) < new Date() &&
          advert.status === JournalAdvertStatus.ReadyForPublication
        ) {
          pastDue++
        }
      })

      categories = [
        {
          text: `${today} tilbúin mál eru áætluð til útgáfu í dag.`,
          totalAdverts: today,
        },
        {
          text: `${pastDue} mál í yfirlestri eru með liðinn birtingardag.`,
          totalAdverts: pastDue,
        },
      ]
      totalAdverts = adverts.length
    } else {
      throw new BadRequestException('Invalid type')
    }
    return Promise.resolve({
      categories: categories,
      totalAdverts: totalAdverts,
    })
  }
}
