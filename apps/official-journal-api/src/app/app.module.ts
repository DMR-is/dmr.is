import { HealthModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { JournalModule } from './journal/journal.module'

@Module({
  imports: [JournalModule, HealthModule],
})
export class AppModule {}
