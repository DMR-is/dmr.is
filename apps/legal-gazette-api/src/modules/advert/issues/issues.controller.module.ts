import { Module } from '@nestjs/common'

import { IssuesController } from './issues.controller'
import { IssuesProviderModule } from './issues.provider.module'

@Module({
  imports: [IssuesProviderModule],
  controllers: [IssuesController],
})
export class IssuesControllerModule {}
