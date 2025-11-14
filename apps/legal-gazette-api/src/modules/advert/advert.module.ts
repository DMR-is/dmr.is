import { Module } from '@nestjs/common'

import { AdvertModule } from '../../services/advert/advert.module'
import { PdfModule } from '../../services/pdf/pdf.module'
import { PublicationModule } from '../../services/publication/publication.module'
import { AdvertController } from './controllers/advert.controller'
import { AdvertPdfController } from './controllers/advert-pdf.controller'
import { AdvertPublishController } from './controllers/advert-publish.controller'
import { AdvertUpdateController } from './controllers/advert-update.controller'

@Module({
  imports: [AdvertModule, PublicationModule, PdfModule],
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
