import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../case/case.model'
import { RecallApplicationModel } from './recall/recall-application.model'
import { ApplicationController } from './application.controller'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel, RecallApplicationModel])],
  controllers: [ApplicationController],
  providers: [],
  exports: [],
})
export class ApplicationModule {}
