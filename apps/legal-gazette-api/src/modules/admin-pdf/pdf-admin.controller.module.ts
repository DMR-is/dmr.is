import { Module } from '@nestjs/common'

import { PdfAdminController } from './pdf-admin.controller'
import { PdfAdminProviderModule } from './pdf-admin.provider.module'

@Module({
  imports: [PdfAdminProviderModule],
  controllers: [PdfAdminController],
})
export class PdfAdminControllerModule {}
