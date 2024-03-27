import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'

import { JournalModule } from './journal/journal.module'

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
