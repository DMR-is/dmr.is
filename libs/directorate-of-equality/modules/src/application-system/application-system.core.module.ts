import { Module } from '@nestjs/common'

import { ApplicationSystemService } from './application-system.service'
import { IApplicationSystemService } from './application-system.service.interface'

@Module({
  providers: [
    {
      provide: IApplicationSystemService,
      useClass: ApplicationSystemService,
    },
  ],
  exports: [IApplicationSystemService],
})
export class ApplicationSystemCoreModule {}
