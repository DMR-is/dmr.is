import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../../models/case.model'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [],
  providers: [
    {
      provide: ICaseService,
      useClass: CaseService,
    },
  ],
  exports: [ICaseService],
})
export class CaseProviderModule {}
