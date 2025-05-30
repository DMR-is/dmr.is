import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseStatusController } from './case-status.controller'
import { CaseStatusModel } from './case-status.model'

@Module({
  imports: [SequelizeModule.forFeature([CaseStatusModel])],
  controllers: [CaseStatusController],
  providers: [],
  exports: [],
})
export class CaseStatusModule {}
