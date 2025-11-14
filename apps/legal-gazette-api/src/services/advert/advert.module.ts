import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { UserModel } from '../../models/users.model'
import { TypeCategoriesModule } from '../type-categories/type-categories.module'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    TypeCategoriesModule,
    SequelizeModule.forFeature([
      UserModel,
      AdvertModel,
      AdvertPublicationModel,
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [IAdvertService],
})
export class AdvertModule {}
