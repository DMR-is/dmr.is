import { Module } from '@nestjs/common'

import { TypeCategoriesProviderModule } from './type-categories.provider.module'
import { TypeWithCategoriesController } from './type-categories.controller'

@Module({
  imports: [TypeCategoriesProviderModule],
  controllers: [TypeWithCategoriesController],
  providers: [],
  exports: [],
})
export class TypesCategoriesControllerModule {}
