import { GetIssuesDto } from './dto/issues.dto'

export interface IIssuesService {
  getAllIssuesByYear(year: string): Promise<GetIssuesDto>
}

export const IIssuesService = 'IIssuesService'
