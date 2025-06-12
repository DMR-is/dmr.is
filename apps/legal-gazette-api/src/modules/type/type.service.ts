import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { GetTypesDto } from './dto/type.dto'
import { TypeModel } from './type.model'
import { ITypeService } from './type.service.interface'

@Injectable()
export class TypeService implements ITypeService {
  constructor(
    @InjectModel(TypeModel)
    private typeModel: typeof TypeModel,
  ) {}

  async getTypes(): Promise<GetTypesDto> {
    const types = await this.typeModel.findAll()

    const migrated = types.map((type) => this.typeModel.fromModel(type))

    return {
      types: migrated,
    }
  }
}
