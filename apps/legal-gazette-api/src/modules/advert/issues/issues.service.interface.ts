import { GetIssuesDto, GetIssuesQuery } from '../../../models/issues.model'

export interface IIssuesService {
  getAllPublishedIssues(q: GetIssuesQuery): Promise<GetIssuesDto>
}

export const IIssuesService = 'IIssuesService'
