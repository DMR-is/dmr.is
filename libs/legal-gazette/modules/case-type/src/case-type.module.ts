import { Module } from '@nestjs/common'
import { ICaseTypeService } from './case-type.service.interface'
import { CaseTypeService } from './case-type.service'
import { CaseTypeController } from './case-type.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { CaseTypeModel } from './models/case-type.model'

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
