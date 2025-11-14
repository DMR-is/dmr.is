import { Module } from '@nestjs/common'

import { TypeCategoriesModule } from '../../services/type-categories/type-categories.module'
import { TypeWithCategoriesController } from './type-categories.controller'

@Module({
  imports: [TypeCategoriesModule],
  controllers: [TypeWithCategoriesController],
  providers: [],
  exports: [],
})
export class TypesCategoriesControllerModule {}
