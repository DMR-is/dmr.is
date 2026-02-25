import { Module } from '@nestjs/common'

import { AdvisoryLockService } from './advisory-lock.service'
export { AdvisoryLockService } from './advisory-lock.service'

@Module({
  providers: [AdvisoryLockService],
  exports: [AdvisoryLockService],
})
export class AdvisoryLockModule {}
