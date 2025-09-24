import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { FeeCodeController } from './fee-code.controller'
import { FeeCodeModel } from './fee-code.model'
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
