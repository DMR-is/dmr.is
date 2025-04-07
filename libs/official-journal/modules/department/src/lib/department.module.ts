import { AdvertDepartmentModel } from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { DepartmentController } from './department.controller'
import { DepartmentService } from './department.service'
import { IDepartmentService } from './department.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertDepartmentModel])],
  controllers: [DepartmentController],
  providers: [
    {
      provide: IDepartmentService,
      useClass: DepartmentService,
    },
  ],
  exports: [IDepartmentService],
})
export class DepartmentModule {}
