export interface IIssuesService {
  generateMonthlyIssues(departmentId: string, date: Date): Promise<void>
}

export const IIssuesService = Symbol('IIssuesService')
