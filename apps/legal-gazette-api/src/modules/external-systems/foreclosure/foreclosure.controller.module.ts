import { Module } from '@nestjs/common'

import { ForeclosureController } from './foreclosure.controller'
import { ForeclosureProviderModule } from './foreclosure.provider.module'

@Module({
  imports: [ForeclosureProviderModule],
  controllers: [ForeclosureController],
})
export class ForeclosureControllerModule {}
