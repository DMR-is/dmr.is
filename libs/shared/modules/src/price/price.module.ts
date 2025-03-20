import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationModule } from '../application/application.module'
import { AuthModule } from '../auth/auth.module'
import { CaseModel, CaseTransactionModel } from '../case/models'
import { AdvertDepartmentModel, AdvertFeeCodesModel } from '../journal/models'
import { PriceService } from './price.service'
import { IPriceService } from './price.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      AdvertDepartmentModel,
      CaseTransactionModel,
      AdvertFeeCodesModel,
    ]),
    AuthModule,
    forwardRef(() => ApplicationModule),
    LoggingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: IPriceService,
      useClass: PriceService,
    },
  ],
  exports: [IPriceService],
})
export class PriceModule {}
