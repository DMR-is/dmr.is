import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../../../case/case.model'
import { CommonApplicationController } from './common-application.controller'
import { CommonApplicationModel } from './common-application.model'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel, CommonApplicationModel])],
  controllers: [CommonApplicationController],
  providers: [],
  exports: [],
})
export class CommonApplicationModule {}
