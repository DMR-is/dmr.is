/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { TBRCompanySettingsModel } from '../../../models/tbr-company-settings.model'
import { TypeModel } from '../../../models/type.model'
import { ApplicationProviderModule } from '../../applications/application.provider.module'
import { PriceCalculatorService } from './price-calculator.service'
import { IPriceCalculatorService } from './price-calculator.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      TypeModel,
      TBRCompanySettingsModel,
    ]),
    forwardRef(() => ApplicationProviderModule),
  ],
  providers: [
    {
      provide: IPriceCalculatorService,
      useClass: PriceCalculatorService,
    },
  ],
  exports: [IPriceCalculatorService],
})
export class PriceCalculatorProviderModule {}
