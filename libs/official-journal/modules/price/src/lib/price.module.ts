import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { PriceService } from './price.service'
import { IPriceService } from './price.service.interface'
import { ApplicationModule } from '@dmr.is/official-journal/modules/application'
import { AuthModule } from '@dmr.is/official-journal/modules/auth'
import {
  CaseModel,
  CaseTransactionModel,
  TransactionFeeCodesModel,
} from '@dmr.is/official-journal/modules/case'
import { AdvertDepartmentModel } from '@dmr.is/official-journal/modules/journal'

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
    forwardRef(() => ApplicationModule),
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
