import {
  AdvertTypeController,
  AdvertTypeModule,
} from '@dmr.is/official-journal/modules/advert-type'
import { CaseModule } from '@dmr.is/official-journal/modules/case'
import { JournalModule as MainModule } from '@dmr.is/official-journal/modules/journal'

import { Module } from '@nestjs/common'

import { JournalController } from './journal.controller'
@Module({
  imports: [MainModule, CaseModule, AdvertTypeModule],
  controllers: [JournalController, AdvertTypeController],
})
export class JournalModule {}
