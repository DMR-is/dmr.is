import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UserModel } from '../../models/users.model'
import { LGNationalRegistryProviderModule } from '../national-registry/national-registry.provider.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { IUsersService } from './users.service.interface'

@Module({
  imports: [
    LGNationalRegistryProviderModule,
    SequelizeModule.forFeature([UserModel]),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: IUsersService,
      useClass: UsersService,
    },
  ],
  exports: [IUsersService],
})
export class UsersProviderModule {}
