import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'

import { AdvertUpdateGuard } from '../../guards/advert-update.guard'
import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { CategoryModel } from '../../models/category.model'
import { StatusModel } from '../../models/status.model'
import { UserModel } from '../../models/users.model'
import { PublishingService } from '../../services/publishing/publishing.service'
import { AdvertPaymentModule } from '../advert-payment/advert-payment.module'
import { AdvertPublicationModule } from '../advert-publications/advert-publication.module'
import { PdfService } from '../pdf/pdf.service'
import { TypesCategoriesModule } from '../type-categories/type-categories.module'
import { AdvertController } from './controllers/advert.controller'
import { AdvertPdfController } from './controllers/advert-pdf.controller'
import { AdvertPublishController } from './controllers/advert-publish.controller'
import { AdvertUpdateController } from './controllers/advert-update.controller'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      AdvertModel,
      AdvertPublicationModel,
      StatusModel,
      CategoryModel,
    ]),
    AdvertPublicationModule,
    AdvertPaymentModule,
    TypesCategoriesModule,
    AwsModule,
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
