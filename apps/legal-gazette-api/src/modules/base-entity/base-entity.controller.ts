/* eslint-disable @typescript-eslint/no-explicit-any */

import { Controller, Get, NotFoundException, Param } from '@nestjs/common'

import { BaseEntityModel } from '@dmr.is/shared/models/base'

@Controller()
export class BaseEntityController<Model extends typeof BaseEntityModel> {
  constructor(protected readonly model: Model) {}

  @Get()
  async findAll(options?: any): Promise<any> {
    const categories = await this.model.findAll(options)

    return categories.map((entity) => entity.fromModel())
  }

  @Get(':id')
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
