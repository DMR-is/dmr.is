import { SequelizeConfigService } from '@dmr.is/db'
import { HealthModule } from '@dmr.is/modules'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'

import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { JournalModule } from './journal/journal.module'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    JournalModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
