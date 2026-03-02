import { GetIssuesDto, GetIssuesQuery } from './dto/issues.dto'

export interface IIssuesService {
  getAllPublishedIssues(q: GetIssuesQuery): Promise<GetIssuesDto>
}

export const IIssuesService = 'IIssuesService'
