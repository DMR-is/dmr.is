import { Module } from '@nestjs/common'

import { AdvisoryLockModule } from '@dmr.is/shared-modules'

import { IssuesModule } from '../issues.module'
import { IssuesTaskService } from './issues.task'
import { IIssuesTaskService } from './issues.task.service.interface'

@Module({
  imports: [IssuesModule, AdvisoryLockModule],
  providers: [{ provide: IIssuesTaskService, useClass: IssuesTaskService }],
  exports: [IIssuesTaskService],
})
export class IssuesTaskModule {}
