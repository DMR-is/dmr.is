import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertUpdateGuard } from '../../guards/advert-update.guard'
import { PublishingService } from '../../services/publishing/publishing.service'
import { AdvertPublicationModel } from '../advert-publications/advert-publication.model'
import { AdvertPublicationModule } from '../advert-publications/advert-publication.module'
import { CategoryModel } from '../category/category.model'
import { PdfService } from '../pdf/pdf.service'
import { StatusModel } from '../status/status.model'
import { AdvertController } from './controllers/advert.controller'
import { AdvertPdfController } from './controllers/advert-pdf.controller'
import { AdvertPublishController } from './controllers/advert-publish.controller'
import { AdvertUpdateController } from './controllers/advert-update.controller'
import { AdvertModel } from './advert.model'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertPublicationModel,
      StatusModel,
      CategoryModel,
    ]),
    AdvertPublicationModule,
  ],
  controllers: [
    AdvertUpdateController,
    AdvertPdfController,
    AdvertController,
    AdvertPublishController,
  ],
  providers: [
    AdvertUpdateGuard,
    PublishingService,
    PdfService,
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [IAdvertService],
})
export class AdvertModule {}
