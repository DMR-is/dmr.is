import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import { CaseDto } from '../case/models'
import { models as advertModels } from '../journal/models'
import { UtilityService } from './utility.service'
import { IUtilityService } from './utility.service.interface'
@Module({
  imports: [
    SequelizeModule.forFeature([CaseDto, ...advertModels]),
    LoggingModule,
    ApplicationModule,
  ],
  providers: [
    {
      provide: IUtilityService,
      useClass: UtilityService,
    },
  ],
  exports: [IUtilityService],
})
export class UtilityModule {}
