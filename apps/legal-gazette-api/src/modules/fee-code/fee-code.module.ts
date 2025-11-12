import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { FeeCodeModel } from '../../models/fee-code.model'
import { FeeCodeController } from './fee-code.controller'
import { FeeCodeService } from './fee-code.service'
import { IFeeCodeService } from './fee-code.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([FeeCodeModel])],
  controllers: [FeeCodeController],
  providers: [
    {
      provide: IFeeCodeService,
      useClass: FeeCodeService,
    },
  ],
  exports: [IFeeCodeService],
})
export class FeeCodeModule {}
