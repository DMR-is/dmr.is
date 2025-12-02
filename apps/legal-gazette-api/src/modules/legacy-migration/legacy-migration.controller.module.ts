import { Module } from '@nestjs/common'

import { LegacyMigrationController } from './legacy-migration.controller'
import { LegacyMigrationProviderModule } from './legacy-migration.provider.module'

@Module({
  imports: [LegacyMigrationProviderModule],
  controllers: [LegacyMigrationController],
})
export class LegacyMigrationControllerModule {}
