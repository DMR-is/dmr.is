/* eslint-disable @typescript-eslint/no-explicit-any */

import { FindOptions } from 'sequelize'

import { Controller, NotFoundException, Param } from '@nestjs/common'

import { BaseEntityModel } from '@dmr.is/shared/models/base'

// TODO: IS THIS USED ANYWHERE? IF NOT, DELETE IT
/* eslint-disable local-rules/require-controller-auth-decorators */
@Controller()
export class BaseEntityController<Model extends typeof BaseEntityModel<T>, T> {
  constructor(protected readonly model: Model) {}

  async findAll(options?: FindOptions): Promise<any> {
    const entities = await this.model.findAll(options)

    return entities.map((entity) => entity.fromModel())
  }

  async findById(@Param('id') id: string): Promise<any> {
    const entity = await this.model.findByPk(id)
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`)
    }
    return entity.fromModel()
  }

  async findBySlug(slug: string): Promise<any> {
    const entity = await this.model.findOne({ where: { slug } })
    if (!entity) {
      throw new NotFoundException(`Entity with slug ${slug} not found`)
    }
    return entity.fromModel()
  }
}
