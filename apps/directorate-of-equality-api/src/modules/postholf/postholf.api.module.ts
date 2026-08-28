import { Module } from '@nestjs/common'

import { PostholfCoreModule } from './postholf.core.module'
import { PostholfCallbackController } from './postholf-callback.controller'

@Module({
  imports: [PostholfCoreModule],
  controllers: [PostholfCallbackController],
})
export class PostholfApiModule {}
