




export interface IIssuesService {
  generateMonthlyIssues(departmentId: string): Promise<void>
}

export const IIssuesService = Symbol('IIssuesService')
