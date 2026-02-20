import { Module } from '@nestjs/common'

import { PgAdvisoryLockService as AdvisoryLockService } from './advisory-lock.service'

@Module({
  providers: [AdvisoryLockService],
  exports: [AdvisoryLockService],
})
export class AdvisoryLockModule {}
