import { Module } from '@nestjs/common'

import { LGNationalRegistryController } from './national-registry.controller'
import { LGNationalRegistryProviderModule } from './national-registry.provider.module'

@Module({
  imports: [LGNationalRegistryProviderModule],
  controllers: [LGNationalRegistryController],
})
export class LGNationalRegistryControllerModule {}
