import {
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'

export interface IIssuesReadService {
  getIssues(
    query: GetMonthlyIssuesQueryDto,
  ): Promise<GetMonthlyIssuesResponseDto>
}

export const IIssuesReadService = Symbol('IIssuesReadService')
