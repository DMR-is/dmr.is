import { Module } from '@nestjs/common'

import { PdfModule } from '../../services/pdf/pdf.module'
import { PublicationProviderModule } from '../publications/publication.provider.module'
import { AdvertController } from './controllers/advert.controller'
import { AdvertPdfController } from './controllers/advert-pdf.controller'
import { AdvertPublishController } from './controllers/advert-publish.controller'
import { AdvertUpdateController } from './controllers/advert-update.controller'
import { AdvertProviderModule } from './advert.provider.module'

@Module({
  imports: [AdvertProviderModule, PublicationProviderModule, PdfModule],
  controllers: [
    AdvertUpdateController,
    AdvertPdfController,
    AdvertController,
    AdvertPublishController,
  ],
  providers: [],
  exports: [],
})
export class AdvertControllerModule {}
