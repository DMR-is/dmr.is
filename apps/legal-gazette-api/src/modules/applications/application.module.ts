import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../case/case.model'
import { BankruptcyApplicationModel } from './bankruptcy/bankruptcy-application.model'
import { ApplicationController } from './application.controller'

@Module({
  imports: [
    SequelizeModule.forFeature([CaseModel, BankruptcyApplicationModel]),
  ],
  controllers: [ApplicationController],
  providers: [],
  exports: [],
})
export class ApplicationModule {}
