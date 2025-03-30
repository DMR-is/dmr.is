import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { PriceService } from './price.service'
import { IPriceService } from './price.service.interface'
import { AuthModule } from '@dmr.is/official-journal/modules/auth'
import {
  AdvertDepartmentModel,
  CaseTransactionModel,
  TransactionFeeCodesModel,
} from '@dmr.is/official-journal/models'

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([
      AdvertDepartmentModel,
      CaseTransactionModel,
      TransactionFeeCodesModel,
    ]),
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
