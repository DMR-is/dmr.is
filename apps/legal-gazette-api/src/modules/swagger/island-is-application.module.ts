import { Module } from '@nestjs/common'

import { IslandIsControllerModule } from '../applications-island-is/island-is.module'

@Module({
  imports: [IslandIsControllerModule],
  providers: [],
  controllers: [],
  exports: [],
})
export class IslandIsApplicationModule {}
