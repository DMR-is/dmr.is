import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { IssueModel } from '../../issues/issues.model'
import { PdfService } from './pdf.service'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertPublicationModel,
      IssueModel,
      AdvertModel,
    ]),
    AwsModule,
  ],
  controllers: [],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfProviderModule {}
