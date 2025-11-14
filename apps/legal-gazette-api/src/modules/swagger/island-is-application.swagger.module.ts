import { Module } from '@nestjs/common'

import { IslandIsControllerModule } from '../applications-island-is/island-is.controller.module'
import { CategoryControllerModule } from '../base-entity/category/category.controller.module'
import { TypeControllerModule } from '../base-entity/type/type.controller.module'

@Module({
  imports: [
    IslandIsControllerModule,
    TypeControllerModule,
    CategoryControllerModule,
  ],
  providers: [],
  controllers: [],
  exports: [],
})
export class IslandIsApplicationSwaggerModule {}
