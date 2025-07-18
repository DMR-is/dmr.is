import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../../case/case.model'
import { BankruptcyApplicationModel } from './models/bankruptcy-application.model'
import { BankruptcyApplicationController } from './bankruptcy-application.controller'

@Module({
  imports: [
    SequelizeModule.forFeature([BankruptcyApplicationModel, CaseModel]),
  ],
  controllers: [BankruptcyApplicationController],
  providers: [],
  exports: [],
})
export class BankruptcyApplicationModule {}
