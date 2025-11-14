import { Inject, Injectable, NotImplementedException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IPublishingTaskService } from './publishing.task.interface'

const LOGGER_CONTEXT = 'PublishingService'

@Injectable()
export class PublishingTaskService implements IPublishingTaskService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  publishAdverts(): Promise<void> {
    const now = new Date()

    this.logger.info(`Running publishing task at ${now.toISOString()}`, {
      context: LOGGER_CONTEXT,
      timestamp: now.toISOString(),
    })

    throw new NotImplementedException('Publishing task not implemented yet')
  }
}
