/* eslint-disable @typescript-eslint/no-explicit-any */

import { FindOptions } from 'sequelize'

import { Controller } from '@nestjs/common'

import { BaseEntityModel } from '@dmr.is/shared-models-base'

@Controller()
export class BaseEntityController<Model extends typeof BaseEntityModel<T>, T> {
  constructor(protected readonly model: Model) {}

  async findAll(options?: FindOptions): Promise<any> {
    const entities = await this.model.findAll(options)

    return entities.map((entity) => entity.fromModel())
  }
}
