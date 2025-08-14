import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../../../case/case.model'
import { CommonApplicationController } from './common-application.controller'
import { CommonApplicationService } from './common-application.service'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [CommonApplicationController],
  providers: [CommonApplicationService],
  exports: [CommonApplicationService],
})
export class CommonApplicationModule {}
