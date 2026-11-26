import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { AuthModule } from '../auth/auth.module'
import {
  CaseModel,
  CaseTransactionModel,
  TransactionFeeCodesModel,
} from '../case/models'
import { AdvertDepartmentModel } from '../journal/models'
import { PriceService } from './price.service'
import { IPriceService } from './price.service.interface'

export { IPriceService, PriceService }

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      AdvertDepartmentModel,
      CaseTransactionModel,
      TransactionFeeCodesModel,
    ]),
    AuthModule,
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
