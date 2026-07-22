import { Module } from '@nestjs/common'

import { CategoryTypeAdminController } from './category-type-admin.controller'
import { CategoryTypeAdminProviderModule } from './category-type-admin.provider.module'

@Module({
  imports: [CategoryTypeAdminProviderModule],
  controllers: [CategoryTypeAdminController],
})
export class CategoryTypeAdminControllerModule {}
