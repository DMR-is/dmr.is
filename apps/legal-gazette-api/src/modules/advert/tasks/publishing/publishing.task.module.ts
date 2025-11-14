import { Module } from '@nestjs/common'

import { PublishingTaskService } from './publishing.task'
import { IPublishingTaskService } from './publishing.task.interface'

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: IPublishingTaskService,
      useClass: PublishingTaskService,
    },
  ],
  exports: [IPublishingTaskService],
})
export class PublishingTaskModule {}
