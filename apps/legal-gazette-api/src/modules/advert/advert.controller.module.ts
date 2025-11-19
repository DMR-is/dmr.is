import { Module } from '@nestjs/common'

import { AdvertController } from './controllers/advert.controller'
import { AdvertCreateController } from './controllers/advert-create.controller'
import { AdvertPdfController } from './controllers/advert-pdf.controller'
import { AdvertPublishController } from './controllers/advert-publish.controller'
import { AdvertUpdateController } from './controllers/advert-update.controller'
import { PdfProviderModule } from './pdf/pdf.provider.module'
import { PublicationProviderModule } from './publications/publication.provider.module'
import { AdvertProviderModule } from './advert.provider.module'

@Module({
  imports: [AdvertProviderModule, PublicationProviderModule, PdfProviderModule],
  controllers: [
    AdvertUpdateController,
    AdvertPdfController,
    AdvertController,
    AdvertPublishController,
    AdvertCreateController,
  ],
  providers: [],
  exports: [],
})
export class AdvertControllerModule {}
