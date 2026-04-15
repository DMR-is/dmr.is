import { Module } from '@nestjs/common'

import { HtmlAdminController } from './html-admin.controller'
import { HtmlAdminProviderModule } from './html-admin.provider.module'

@Module({
  imports: [HtmlAdminProviderModule],
  controllers: [HtmlAdminController],
})
export class HtmlAdminControllerModule {}
