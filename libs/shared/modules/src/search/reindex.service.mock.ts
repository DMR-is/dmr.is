/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  IReindexRunnerService,
  ReindexStatus,
} from './reindex-runner.service.interface'
import { UpdateAdvertInIndexRes } from './types'

@Injectable()
export class MockRunnerService implements IReindexRunnerService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using MockRunnerService')
  }
  getStatus(): ReindexStatus & {
    lock?: boolean | undefined
    lastJobId?: number | undefined
  } {
    throw new Error('Method not implemented.')
  }
  start(maxDocs?: number): Promise<{ jobId: number }> {
    throw new Error('Method not implemented.')
  }
  updateItemInIndex(advertId?: string): Promise<UpdateAdvertInIndexRes> {
    throw new Error('Method not implemented.')
  }
  deleteItemFromIndex(advertId?: string): Promise<UpdateAdvertInIndexRes> {
    throw new Error('Method not implemented.')
  }
}
