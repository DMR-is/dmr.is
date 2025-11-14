import { DynamicModule, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TBRTransactionModel } from '../../models/tbr-transactions.model'
import { ITBRConfig } from './tbr.config'
import { TBRService } from './tbr.service'
import { ITBRService } from './tbr.service.interface'

@Module({})
export class TBRModule {
  static forRoot(config: ITBRConfig): DynamicModule {
    return {
      imports: [SequelizeModule.forFeature([TBRTransactionModel])],
      module: TBRModule,
      providers: [
        {
          provide: ITBRService,
          useValue: config,
        },
        {
          provide: ITBRService,
          useClass: TBRService,
        },
      ],
      exports: [ITBRService],
    }
  }
}
