import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { UserModel } from '../../../models/users.model'
import { AdvertProviderModule } from '../../advert/advert.provider.module'
import { AdvertService } from '../../advert/advert.service'
import { IAdvertService } from '../../advert/advert.service.interface'
import { TypeCategoriesProviderModule } from '../../type-categories/type-categories.provider.module'
import { CompanyService } from './company.service'
import { ICompanyService } from './company.service.interface'
@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      AdvertModel,
      AdvertPublicationModel,
    ]),
    TypeCategoriesProviderModule,
    AdvertProviderModule,
  ],
  controllers: [],
  providers: [
    {
      provide: ICompanyService,
      useClass: CompanyService,
    },
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [ICompanyService, IAdvertService],
})
export class CompanyProviderModule {}
