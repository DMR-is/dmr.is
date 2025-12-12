import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TBRCompanySettingsModel } from '../../../models/tbr-company-settings.model'
import { TBRCompanySettingsService } from './tbr-company-settings.service'
import { ITBRCompanySettingsService } from './tbr-company-settings.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([TBRCompanySettingsModel])],
  providers: [
    {
      provide: ITBRCompanySettingsService,
      useClass: TBRCompanySettingsService,
    },
  ],
  exports: [ITBRCompanySettingsService],
})
export class TBRCompanySettingsProviderModule {}
