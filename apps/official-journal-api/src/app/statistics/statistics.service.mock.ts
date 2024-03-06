import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { IStatisticsService } from './statistics.service.interface'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { StatisticsDepartmentQuery } from '../../dto/statistics/statistics-department-query.dto'
import { StatisticsDepartmentResponse } from '../../dto/statistics/statistics-department.dto'
import { ALL_MOCK_ADVERTS } from '../../mock/journal.mock'
import { JournalAdvertStatus } from '../../dto/journal-constants.dto'

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

    const adverts = ALL_MOCK_ADVERTS.filter(
      (advert) =>
        advert.department.id === params.id &&
        (advert.status === JournalAdvertStatus.Submitted ||
          advert.status === JournalAdvertStatus.InProgress ||
          advert.status === JournalAdvertStatus.Active ||
          advert.status === JournalAdvertStatus.ReadyForPublication),
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
}
