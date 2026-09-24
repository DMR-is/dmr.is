import { Module } from '@nestjs/common'

import { OneSystemsService } from './onesystems.service'
import { IOneSystemsService } from './onesystems.service.interface'

@Module({
  providers: [
    {
      provide: IOneSystemsService,
      useClass: OneSystemsService,
    },
  ],
  exports: [IOneSystemsService],
})
export class OneSystemsModule {}
