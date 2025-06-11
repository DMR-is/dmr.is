import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { TypeController } from './type.controller'
import { TypeModel } from './type.model'
import { TypeService } from './type.service'
import { ITypeService } from './type.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([TypeModel])],
  controllers: [TypeController],
  providers: [
    {
      provide: ITypeService,
      useClass: TypeService,
    },
  ],
  exports: [ITypeService],
})
export class TypeModule {}
