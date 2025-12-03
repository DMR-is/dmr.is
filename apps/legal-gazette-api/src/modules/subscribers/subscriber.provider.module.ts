import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SubscriberModel } from '../../models/subscriber.model'
import { LegacyMigrationProviderModule } from '../legacy-migration/legacy-migration.provider.module'
import { SubscriberController } from './subscriber.controller'
import { SubscriberService } from './subscriber.service'
import { ISubscriberService } from './subscriber.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([SubscriberModel]),
    LegacyMigrationProviderModule,
  ],
  controllers: [SubscriberController],
  providers: [
    {
      provide: ISubscriberService,
      useClass: SubscriberService,
    },
  ],
  exports: [ISubscriberService],
})
export class SubscriberProviderModule {}
