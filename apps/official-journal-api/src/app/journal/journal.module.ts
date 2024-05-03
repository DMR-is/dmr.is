import { SharedJournalModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'

import { SequelizeConfigService } from '../../sequelizeConfig.service'
import { JournalController } from './journal.controller'
@Module({
  imports: [SharedJournalModule],
  controllers: [JournalController],
})
export class JournalModule {}
