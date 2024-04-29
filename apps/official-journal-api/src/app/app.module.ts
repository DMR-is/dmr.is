import { HealthController, JournalModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { JournalController } from './journal/journal.controller'

@Module({
  imports: [JournalModule],
  controllers: [HealthController, JournalController],
})
export class AppModule {}
