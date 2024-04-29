import { HealthController } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { JournalController } from './journal/journal.controller'
import { JournalModule } from './journal/journal.module'

@Module({
  imports: [JournalModule],
  controllers: [HealthController, JournalController],
})
export class AppModule {}
