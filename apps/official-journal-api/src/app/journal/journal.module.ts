import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import {
  AdvertTypeController,
  AdvertTypeModule,
  CaseListModule,
  IssuesModule,
  OpenSearchModule,
  OpsModule,
  SharedJournalModule,
} from '@dmr.is/ojoi-modules'

import { AdvertSearchEventModel } from './models/advert-search-event.model'
import { JournalController } from './journal.controller'
import { LeanSearchTrackingService } from './lean-search-tracking.service'
@Module({
  imports: [
    SequelizeModule.forFeature([AdvertSearchEventModel]),
    SharedJournalModule,
    CaseListModule,
    AdvertTypeModule,
    OpenSearchModule,
    OpsModule,
    IssuesModule,
  ],
  controllers: [JournalController, AdvertTypeController],
  providers: [LeanSearchTrackingService],
})
export class JournalModule {}
