import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../../../case/case.model'
import { CommonApplicationController } from './common-application.controller'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [CommonApplicationController],
  providers: [],
  exports: [],
})
export class CommonApplicationModule {}
