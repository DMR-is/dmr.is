import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'

import { LegacyMigrationTokenModel } from '../../models/legacy-migration-token.model'
import { LegacySubscriberModel } from '../../models/legacy-subscriber.model'
import { SubscriberModel } from '../../models/subscriber.model'
import { LegacyMigrationService } from './legacy-migration.service'
import { ILegacyMigrationService } from './legacy-migration.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      LegacySubscriberModel,
      LegacyMigrationTokenModel,
      SubscriberModel,
    ]),
    AwsModule,
  ],
  providers: [
    {
      provide: ILegacyMigrationService,
      useClass: LegacyMigrationService,
    },
  ],
  exports: [ILegacyMigrationService],
})
export class LegacyMigrationProviderModule {}
