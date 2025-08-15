import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../../../case/case.model'
import { IslandIsApplicationController } from './island-is-application.controller'
import { IslandIsCommonApplicationService } from './island-is-application.service'
import { IIslandIsCommonApplicationService } from './island-is-application.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel])],
  controllers: [IslandIsApplicationController],
  providers: [
    {
      provide: IIslandIsCommonApplicationService,
      useClass: IslandIsCommonApplicationService,
    },
  ],
  exports: [IIslandIsCommonApplicationService],
})
export class IslandIsCommonApplicationModule {}
