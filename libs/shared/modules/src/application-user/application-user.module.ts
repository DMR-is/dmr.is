import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationUserService } from './application-user.service'
import { IApplicationUserService } from './application-user.service.interface'
import models from './models'

export { IApplicationUserService, ApplicationUserService }

@Module({
  imports: [SequelizeModule.forFeature([...models]), LoggingModule],
  providers: [
    {
      provide: IApplicationUserService,
      useClass: ApplicationUserService,
    },
  ],
  exports: [IApplicationUserService],
})
export class ApplicationUserModule {}
