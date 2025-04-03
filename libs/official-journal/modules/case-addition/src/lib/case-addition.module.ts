import {
  CaseAdditionModel,
  CaseAdditionsModel,
} from '@dmr.is/official-journal/models'
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ICaseAdditionService } from './case-addition.service.interface'
import { CaseAdditionService } from './case-addition.service'

@Module({
  imports: [
    SequelizeModule.forFeature([CaseAdditionModel, CaseAdditionsModel]),
  ],
  controllers: [],
  providers: [
    {
      provide: ICaseAdditionService,
      useClass: CaseAdditionService,
    },
  ],
  exports: [ICaseAdditionService],
})
export class CaseAdditionModule {}
