import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { models as advertTypeModels } from '../advert-type/models'
import { ApplicationModule } from '../application/application.module'
import caseModels from '../case/models'
import advertModels from '../journal/models'
import { UtilityService } from './utility.service'
import { IUtilityService } from './utility.service.interface'

export { IUtilityService, UtilityService }
@Module({
  imports: [
    SequelizeModule.forFeature([
      ...caseModels,
      ...advertModels,
      ...advertTypeModels,
    ]),
    LoggingModule,
    forwardRef(() => ApplicationModule),
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
