import { DynamicModule, Module } from '@nestjs/common'

import { ITBRConfig } from './tbr.config'
import { TBRService } from './tbr.service'
import { ITBRService } from './tbr.service.interface'

@Module({})
export class TBRModule {
  static forRoot(config: ITBRConfig): DynamicModule {
    return {
      module: TBRModule,
      providers: [
        {
          provide: ITBRConfig,
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
