import { Module } from '@nestjs/common'

import { CaseModule } from '../case/case.module'

@Module({
  imports: [CaseModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApplicationWebModule {}
