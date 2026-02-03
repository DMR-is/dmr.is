import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertTypeModel } from '../advert-type/models'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
  AdvertStatusModel,
} from '../journal/models'
import { ReindexRunnerService } from './reindex-runner.service'
import { IReindexRunnerService } from './reindex-runner.service.interface'
import { OpenSearchModule } from './search.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    OpenSearchModule,
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertDepartmentModel,
      AdvertCategoryModel,
      AdvertInvolvedPartyModel,
      AdvertStatusModel,
      AdvertTypeModel,
    ]),
  ],
  providers: [
    {
      provide: IReindexRunnerService,
      useClass: ReindexRunnerService,
    },
  ],
  exports: [IReindexRunnerService],
})
export class OpsModule {}
