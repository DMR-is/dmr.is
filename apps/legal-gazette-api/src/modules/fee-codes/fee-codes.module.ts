import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { FeeCodesController } from './fee-codes.controller'
import { FeeCodesModel } from './fee-codes.model'
import { FeeCodesService } from './fee-codes.service'
import { IFeeCodesService } from './fee-codes.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([FeeCodesModel])],
  controllers: [FeeCodesController],
  providers: [
    {
      provide: IFeeCodesService,
      useClass: FeeCodesService,
    },
  ],
  exports: [IFeeCodesService],
})
export class FeeCodesModule {}
