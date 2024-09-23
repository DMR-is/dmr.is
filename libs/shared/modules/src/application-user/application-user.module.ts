import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UserService } from './application-user.service'
import { IUserService } from './application-user.service.interface'
import models from './models'

@Module({
  imports: [SequelizeModule.forFeature([...models]), LoggingModule],
  providers: [
    {
      provide: IUserService,
      useClass: UserService,
    },
  ],
  exports: [IUserService],
})
export class UserModule {}
