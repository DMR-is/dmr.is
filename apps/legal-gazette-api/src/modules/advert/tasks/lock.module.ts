import { Module } from '@nestjs/common'

import { PgAdvisoryLockService } from './lock.service'

@Module({
  providers: [PgAdvisoryLockService],
  exports: [PgAdvisoryLockService],
})
export class PgAdvisoryLockModule {}
