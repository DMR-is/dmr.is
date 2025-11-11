import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseController } from './case.controller'
import { CaseModel } from '../../models/case.model'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [CaseController],
  providers: [
    {
      provide: ICaseService,
      useClass: CaseService,
    },
  ],
  exports: [ICaseService],
})
export class CaseModule {}
