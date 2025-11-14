import {
  GetAdvertsInProgressStatsDto,
  GetAdvertsToBePublishedStatsDto,
  GetCountByStatusesDto,
} from './statistics.dto'

export interface IStatisticsService {
  getCountByStatuses(): Promise<GetCountByStatusesDto>
  getAdvertsInProgressStats(): Promise<GetAdvertsInProgressStatsDto>
  getAdvertsToBePublishedStats(): Promise<GetAdvertsToBePublishedStatsDto>
}

export const IStatisticsService = 'IStatisticsService'
