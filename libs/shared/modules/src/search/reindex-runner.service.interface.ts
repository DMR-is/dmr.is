export type ReindexStatus = {
  state?: 'idle' | 'running' | 'succeeded' | 'failed'
  progress: number
  message?: string
  result?: any
  startedAt?: number
  finishedAt?: number
}

export interface IReindexRunnerService {
  getStatus(): ReindexStatus & {
    lock?: boolean
    lastJobId?: number
  }

  start(maxDocs?: number): Promise<{ jobId: number }>
}

export const IReindexRunnerService = Symbol('IReindexRunnerService')
