import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TBRTransactionModel } from '../../models/tbr-transactions.model'
import { TBRModule } from '../tbr/tbr.module'
import { PaymentsService } from './payments.service'
import { IPaymentsService } from './payments.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([TBRTransactionModel]),
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrBasePath: process.env.LG_TBR_PATH!,
    }),
  ],
  providers: [
    {
      provide: IPaymentsService,
      useClass: PaymentsService,
    },
  ],
  exports: [IPaymentsService],
})
export class PyamentsProviderModule {}
