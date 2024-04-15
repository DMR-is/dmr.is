import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { LoggingModule } from '@dmr.is/logging'

import { JournalController } from './journal.controller'
import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'
import { MockJournalService } from './journal.service.mock'
import { AdvertDepartment } from '../models/AdvertDepartment'
import { AdvertType } from '../models/AdvertType'

const MOCK_DATA = false

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertDepartment, AdvertType]),
    LoggingModule,
  ],
  controllers: [JournalController],
  providers: [
    {
      provide: IJournalService,
      useClass: MOCK_DATA ? MockJournalService : JournalService,
    },
  ],
})
export class JournalModule {}
