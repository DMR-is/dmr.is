import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { BackfilledPublicationModel } from '../../models/backfilled-publication.model'
import { HtmlAdminService } from './html-admin.service'
import { IHtmlAdminService } from './html-admin.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertPublicationModel,
      BackfilledPublicationModel,
    ]),
  ],
  providers: [
    {
      provide: IHtmlAdminService,
      useClass: HtmlAdminService,
    },
  ],
  exports: [IHtmlAdminService],
})
export class HtmlAdminProviderModule {}
