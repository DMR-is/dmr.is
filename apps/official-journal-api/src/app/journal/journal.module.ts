import { CaseModel } from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalService } from './journal.service'
import { IJournalService } from './journal.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [],
  providers: [
    {
      provide: IJournalService,
      useClass: JournalService,
    },
  ],
  exports: [IJournalService],
})
export class JournalModule {}
