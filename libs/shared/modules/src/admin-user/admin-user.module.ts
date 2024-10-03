import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminUserService } from './admin-user.service'
import { IAdminUserService } from './admin-user.service.interface'
import models from './models'

export * from './admin-user.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([...models]), LoggingModule],
  controllers: [],
  providers: [
    {
      provide: IAdminUserService,
      useClass: AdminUserService,
    },
  ],
  exports: [IAdminUserService],
})
export class AdminUserModule {}
