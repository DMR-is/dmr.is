/* eslint-disable no-case-declarations */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'

import { JournalAdvert, JournalAdvertStatus } from '@dmr.is/shared/dto/journal'
import { ALL_MOCK_ADVERTS as MockAdverts } from '@dmr.is/mocks'
import {
  StatisticsDepartmentResponse,
  StatisticsOverviewCategory,
  StatisticsOverviewQueryType,
  StatisticsOverviewResponse,
} from '@dmr.is/shared/dto/cases'

const ALL_MOCK_ADVERTS = MockAdverts as JournalAdvert[]

@Injectable()
export class MockStatisticsService implements IStatisticsService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using StatisticsServiceMock')
  }
  getDepartment(id: string): Promise<StatisticsDepartmentResponse> {
    if (!id) {
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
        advert.department.id === id && statuses.includes(advert.status),
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

  getOverview(type: string): Promise<StatisticsOverviewResponse> {
    if (!type) {
      throw new BadRequestException('Missing parameters')
    }

    // check if type is in enum
    if (!Object.values<string>(StatisticsOverviewQueryType).includes(type)) {
      throw new BadRequestException('Invalid type')
    }

    let categories: StatisticsOverviewCategory[] = []
    let totalAdverts = 0

    if (type === StatisticsOverviewQueryType.General) {
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
    } else if (type === StatisticsOverviewQueryType.Personal) {
      throw new NotImplementedException()
    } else if (type === StatisticsOverviewQueryType.Inactive) {
      throw new NotImplementedException()
    } else if (type === StatisticsOverviewQueryType.Publishing) {
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
