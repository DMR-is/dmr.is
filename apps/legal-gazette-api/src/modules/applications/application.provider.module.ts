import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { NationalRegistryModule } from '@dmr.is/clients/national-registry'

import { ApplicationModel } from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import { CategoryModel } from '../../models/category.model'
import { AdvertProviderModule } from '../advert/advert.provider.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [
    AdvertProviderModule,
    NationalRegistryModule,
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
