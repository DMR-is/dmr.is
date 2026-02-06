import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { PdfProviderModule } from '../advert/pdf/pdf.provider.module'
import { PdfAdminService } from './pdf-admin.service'
import { IPdfAdminService } from './pdf-admin.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertPublicationModel]),
    PdfProviderModule,
  ],
  controllers: [],
  providers: [
    {
      provide: IPdfAdminService,
      useClass: PdfAdminService,
    },
  ],
  exports: [IPdfAdminService],
})
export class PdfAdminProviderModule {}
