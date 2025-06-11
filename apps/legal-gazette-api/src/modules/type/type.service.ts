import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { baseEntityMigrate } from '@dmr.is/legal-gazette/dto'

import { GetTypesDto, TypeDto } from './dto/type.dto'
import { TypeModel } from './type.model'
import { ITypeService } from './type.service.interface'

@Injectable()
export class TypeService implements ITypeService {
  constructor(
    @InjectModel(TypeModel)
    private typeModel: typeof TypeModel,
  ) {}

  async getTypes(): Promise<GetTypesDto> {
    const type = await this.typeModel.findAll()

    const migrated = type.map((advertType) =>
      baseEntityMigrate<TypeModel, TypeDto>(advertType),
    )

    return {
      types: migrated,
    }
  }
}
