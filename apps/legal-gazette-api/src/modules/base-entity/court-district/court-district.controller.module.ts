import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CourtDistrictController } from './court-district.controller'

@Module({
  imports: [SequelizeModule.forFeature([])],
  controllers: [CourtDistrictController],
  providers: [],
  exports: [],
})
export class CourtDistrictControllerModule {}
