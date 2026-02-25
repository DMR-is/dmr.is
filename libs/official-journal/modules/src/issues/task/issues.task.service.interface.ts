export interface IIssuesTaskService {
  generateMonthlyIssues(): Promise<void>
}

export const IIssuesTaskService = Symbol('IIssuesTaskService')
