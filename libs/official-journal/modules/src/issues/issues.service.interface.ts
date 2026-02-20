import {
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'

export interface IIssuesService {
  generateMonthlyIssues(departmentId: string, date: Date): Promise<void>

  getIssues(
    query: GetMonthlyIssuesQueryDto,
  ): Promise<GetMonthlyIssuesResponseDto>
}

export const IIssuesService = Symbol('IIssuesService')
