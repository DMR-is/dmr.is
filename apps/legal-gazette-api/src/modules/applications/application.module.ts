import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../case/case.model'
import { ApplicationController } from './application.controller'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [ApplicationController],
  providers: [],
  exports: [],
})
export class ApplicationModule {}
