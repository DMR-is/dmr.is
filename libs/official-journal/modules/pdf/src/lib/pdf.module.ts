import { Module } from '@nestjs/common'

import { PdfController } from './pdf.controller'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'

@Module({
  imports: [UtilityModule],
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
