import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'

import { SharedCaseModule } from '../case/case.module'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

@Module({
  imports: [LoggingModule, forwardRef(() => SharedCaseModule)],
  providers: [
    {
      provide: IPdfService,
      useClass: PdfService,
    },
  ],
  exports: [IPdfService],
})
export class PdfModule {}
