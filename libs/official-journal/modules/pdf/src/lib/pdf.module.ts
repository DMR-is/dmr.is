import { Module } from '@nestjs/common'

import { PdfController } from './pdf.controller'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'
import { ApplicationModule } from '@dmr.is/shared/modules/application'
import { SequelizeModule } from '@nestjs/sequelize'
import { CaseModel } from '@dmr.is/official-journal/models'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel]), ApplicationModule],
  controllers: [PdfController],
  providers: [
    {
      provide: IPdfService,
      useClass: PdfService,
    },
  ],
  exports: [IPdfService],
})
export class PdfModule {}
