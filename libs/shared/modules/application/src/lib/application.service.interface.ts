/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IApplicationService {
  getApplication(id: string): Promise<Record<string, any>>

  updateApplication(
    id: string,
    answers?: Record<string, any>,
  ): Promise<Record<string, any>>

  submitApplication(id: string, event: string): Promise<Record<string, any>>
}

export const IApplicationService = Symbol('IApplicationService')
