import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TypeModel } from '../../models/type.model'
import { TypeCategoriesService } from './type-categories.service'
import { ITypeCategoriesService } from './type-categories.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([TypeModel])],
  controllers: [],
  providers: [
    {
      provide: ITypeCategoriesService,
      useClass: TypeCategoriesService,
    },
  ],
  exports: [ITypeCategoriesService],
})
export class TypeCategoriesProviderModule {}
