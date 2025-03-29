import { AdvertDepartmentModel } from '@dmr.is/official-journal/models'
import { SequelizeModule } from '@nestjs/sequelize'
import { Module } from '@nestjs/common'
import { IDepartmentService } from './department.service.interface'
import { DepartmentService } from './department.service'
import { DepartmentController } from './department.controller'

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
