import { Module } from '@nestjs/common'

import { AdvertPdfController } from '../advert/controllers/advert-pdf.controller'
import { IssuesControllerModule } from '../advert/issues/issues.controller.module'
import { PdfProviderModule } from '../advert/pdf/pdf.provider.module'
import { PublicationControllerModule } from '../advert/publications/publication.controller.module'
import { PublicationProviderModule } from '../advert/publications/publication.provider.module'
import { CategoryControllerModule } from '../base-entity/category/category.controller.module'
import { TypeControllerModule } from '../base-entity/type/type.controller.module'
import { SubscriberControllerModule } from '../subscribers/subscriber.controller.module'

@Module({
  imports: [
    PdfProviderModule,
    PublicationProviderModule,
    TypeControllerModule,
    CategoryControllerModule,
    SubscriberControllerModule,
    PublicationControllerModule,
    IssuesControllerModule,
  ],
  controllers: [AdvertPdfController],
  providers: [],
  exports: [],
})
export class PublicWebSwaggerModule {}
