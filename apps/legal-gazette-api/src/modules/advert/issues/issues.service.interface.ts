import { GetIssuesDto } from '../../../models/issues.model'

export interface IIssuesService {
  getAllIssuesByYear(year: string): Promise<GetIssuesDto>
}

export const IIssuesService = 'IIssuesService'
