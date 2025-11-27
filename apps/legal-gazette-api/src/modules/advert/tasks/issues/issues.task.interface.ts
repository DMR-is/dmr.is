export interface IIssuesTask {
  dailyIssueGeneration(): Promise<void>
}

export const IIssuesTask = Symbol('IIssuesTask')
