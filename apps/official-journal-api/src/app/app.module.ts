import { JournalModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'

@Module({
  imports: [
    JournalModule,
    RouterModule.register([
      {
        path: 'journal',
        module: JournalModule,
      },
    ]),
  ],
})
export class AppModule {}
