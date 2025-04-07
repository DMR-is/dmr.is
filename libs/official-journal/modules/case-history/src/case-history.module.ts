import { CaseHistoryModel, CaseModel } from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseHistoryService } from './lib/case-history.service'
import { ICaseHistoryService } from './lib/case-history.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel, CaseHistoryModel])],
  controllers: [],
  providers: [
    {
      provide: ICaseHistoryService,
      useClass: CaseHistoryService,
    },
  ],
  exports: [ICaseHistoryService],
})
export class CaseHistoryModule {}
