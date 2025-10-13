import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IAdvertService } from '../advert/advert.service.interface'
import { CategoryDefaultIdEnum } from '../category/category.model'
import { getNextWednesday } from '../company/utils'
import { TypeIdEnum } from '../type/type.model'
import {
  CreateForeclosurePropertyDto,
  CreateForeclosureSaleDto,
  ForeclosureDto,
  ForeclosurePropertyDto,
} from './dto/foreclosure.dto'
import { ForeclosureModel } from './foreclosure.model'
import { IForeclosureService } from './foreclosure.service.interface'
import { ForeclosurePropertyModel } from './foreclosure-property.model'

@Injectable()
export class ForeclosureService implements IForeclosureService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @InjectModel(ForeclosureModel)
    private readonly foreclosureModel: typeof ForeclosureModel,
    @InjectModel(ForeclosurePropertyModel)
    private readonly foreclosurePropertyModel: typeof ForeclosurePropertyModel,
  ) {}

  async getForeclosureById(id: string): Promise<ForeclosureDto> {
    const foreclosure = await this.foreclosureModel.findByPkOrThrow(id)

    return foreclosure.fromModel()
  }

  async createForeclosureSale(
    body: CreateForeclosureSaleDto,
  ): Promise<ForeclosureDto> {
    this.logger.info('Creating new foreclosure sale')

    const nextWednesday = getNextWednesday()

    const { id: advertId } = await this.advertService.createAdvert({
      typeId: TypeIdEnum.FORECLOSURE,
      categoryId: CategoryDefaultIdEnum.FORECLOSURES,
      title: `Nauðungarsala - ${body.foreclosureRegion}`,
      createdBy: body.responsibleParty.name,
      createdByNationalId: body.responsibleParty.nationalId,
      signatureName: body.responsibleParty.signatureName,
      signatureLocation: body.responsibleParty.signatureLocation,
      signatureDate: body.responsibleParty.signatureDate,
      scheduledAt: [nextWednesday.toISOString()],
    })

    const newForeClosure = await this.foreclosureModel.create(
      {
        advertId: advertId,
        authorityLocation: body.authorityLocation,
        foreclosureAddress: body.foreclosureAddress,
        foreclosureDate: new Date(body.foreclosureDate),
        foreclosureRegion: body.foreclosureRegion,
        properties: body.properties,
      },
      { returning: true, include: [ForeclosurePropertyModel] },
    )

    await newForeClosure.reload()

    return newForeClosure.fromModel()
  }

  async createForeclosureProperty(
    id: string,
    body: CreateForeclosurePropertyDto,
  ): Promise<ForeclosurePropertyDto> {
    const newPropery = await this.foreclosurePropertyModel.create(
      {
        foreclosureId: id,
        propertyName: body.propertyName,
        propertyNumber: body.propertyNumber,
        propertyAddress: body.propertyAddress,
        propertyTotalPrice: body.propertyTotalPrice,
        claimant: body.claimant,
        respondent: body.respondent,
      },
      { returning: true },
    )

    await newPropery.reload()

    return newPropery.fromModel()
  }

  async deletePropertyFromForeclosure(
    id: string,
    propertyNumber: string,
  ): Promise<void> {
    const property = await this.foreclosurePropertyModel.findOneOrThrow({
      where: { foreclosureId: id, propertyNumber },
    })

    // force true (no soft delete)
    await property.destroy({ force: true })
  }
}
