import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { UtilityModule } from '../utility/utility.module'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

export { IPdfService }

@Module({
  imports: [LoggingModule, UtilityModule],
  providers: [
    {
      provide: IPdfService,
      useClass: PdfService,
    },
  ],
  exports: [IPdfService],
})
export class PdfModule {}
