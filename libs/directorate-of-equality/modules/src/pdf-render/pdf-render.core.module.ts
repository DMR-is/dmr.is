import { Module } from '@nestjs/common'

import { PdfRenderService } from './pdf-render.service'
import { IPdfRenderService } from './pdf-render.service.interface'

/**
 * The HTML→PDF renderer on its own, so a document that is not a report (a
 * notice letter) can be rendered without pulling in the report services.
 *
 * Needs Chromium at runtime, which only the doe-api image ships. Do not import
 * this into the partner API.
 */
@Module({
  providers: [
    {
      provide: IPdfRenderService,
      useClass: PdfRenderService,
    },
  ],
  exports: [IPdfRenderService],
})
export class PdfRenderCoreModule {}
