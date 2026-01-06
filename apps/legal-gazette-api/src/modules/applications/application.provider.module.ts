import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModel } from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import { CategoryModel } from '../../models/category.model'
import { AdvertProviderModule } from '../advert/advert.provider.module'
import { RecallApplicationProviderModule } from './recall/recall-application.provider.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [
    forwardRef(() => AdvertProviderModule),
    RecallApplicationProviderModule,
    SequelizeModule.forFeature([CaseModel, ApplicationModel, CategoryModel]),
  ],
  controllers: [],
  providers: [
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
  exports: [IApplicationService],
})
export class ApplicationProviderModule {}
