import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from '../user/models/user.model'
import { ReportExcelController } from './report-excel.controller'
import { ReportExcelCoreModule } from './report-excel.core.module'

@Module({
  imports: [ReportExcelCoreModule, SequelizeModule.forFeature([UserModel])],
  controllers: [ReportExcelController],
  providers: [AdminGuard],
})
export class ReportExcelApiModule {}
