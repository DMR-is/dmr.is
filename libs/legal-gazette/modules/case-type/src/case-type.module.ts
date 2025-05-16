import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseTypeModel } from './models/case-type.model'
import { CaseTypeController } from './case-type.controller'
import { CaseTypeService } from './case-type.service'
import { ICaseTypeService } from './case-type.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseTypeModel])],
  controllers: [CaseTypeController],
  providers: [
    {
      provide: ICaseTypeService,
      useClass: CaseTypeService,
    },
  ],
  exports: [ICaseTypeService],
})
export class CaseTypeModule {}
