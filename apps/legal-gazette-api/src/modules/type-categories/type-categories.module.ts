import { Module } from '@nestjs/common'

import { TypeWithCategoriesController } from './type-categories.controller'
import { TypeCategoriesProviderModule } from './type-categories.provider.module'

@Module({
  imports: [TypeCategoriesProviderModule],
  controllers: [TypeWithCategoriesController],
  providers: [],
  exports: [],
})
export class TypesCategoriesControllerModule {}
