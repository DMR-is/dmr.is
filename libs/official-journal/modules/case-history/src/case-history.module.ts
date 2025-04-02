import { CaseHistoryModel, CaseModel } from '@dmr.is/official-journal/models'
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel, CaseHistoryModel])],
  controllers: [],
  providers: [],
  exports: [],
})
export class CaseHistoryModule {}
