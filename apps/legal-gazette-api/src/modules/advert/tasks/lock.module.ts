import { Global, Module } from '@nestjs/common'

import { PgAdvisoryXactLockService } from './lock.service'

@Global()
@Module({
  providers: [PgAdvisoryXactLockService],
  exports: [PgAdvisoryXactLockService],
})
export class PgAdvisoryLockModule {}
