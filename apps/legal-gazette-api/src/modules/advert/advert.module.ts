import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertUpdateGuard } from '../../guards/advert-update.guard'
import { PublishingService } from '../../services/publishing/publishing.service'
import { CategoryModel } from '../category/category.model'
import { PdfService } from '../pdf/pdf.service'
import { StatusModel } from '../status/status.model'
import { AdvertController } from './controllers/advert.controller'
import { CommonAdvertController } from './controllers/advert-common.controller'
import { AdvertPdfController } from './controllers/advert-pdf.controller'
import { AdvertPublishController } from './controllers/advert-publish.controller'
import { AdvertUpdateController } from './controllers/advert-update.controller'
import { AdvertModel } from './advert.model'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, StatusModel, CategoryModel]),
  ],
  controllers: [
    AdvertUpdateController,
    AdvertPdfController,
    CommonAdvertController,
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
