/* eslint-disable @typescript-eslint/no-explicit-any */

import { ResultWrapper } from '@dmr.is/types'

export interface IApplicationService {
  getApplication(id: string): Promise<ResultWrapper<{ application: any }>>

  updateApplication(
    id: string,
    answers?: Record<string, any>,
  ): Promise<ResultWrapper<{ application: any }>>

  submitApplication(
    id: string,
    event: string,
  ): Promise<ResultWrapper<{ application: any }>>
}

export const IApplicationService = Symbol('IApplicationService')
