import { Module } from '@nestjs/common'
import { JournalModule } from './journal/journal.module'
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
