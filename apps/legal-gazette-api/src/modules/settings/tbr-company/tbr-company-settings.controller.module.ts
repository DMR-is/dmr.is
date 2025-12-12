import { Module } from '@nestjs/common'

import { TBRCompanySettingsController } from './tbr-company-settings.controller'
import { TBRCompanySettingsProviderModule } from './tbr-company-settings.provider.module'

@Module({
  imports: [TBRCompanySettingsProviderModule],
  controllers: [TBRCompanySettingsController],
})
export class TBRCompanySettingsControllerModule {}
