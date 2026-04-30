import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from '../user/models/user.model'
import { ReportWorkflowController } from './report-workflow.controller'
import { ReportWorkflowCoreModule } from './report-workflow.core.module'

@Module({
  imports: [ReportWorkflowCoreModule, SequelizeModule.forFeature([UserModel])],
  controllers: [ReportWorkflowController],
  providers: [AdminGuard],
})
export class ReportWorkflowApiModule {}
