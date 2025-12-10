import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CategoryDefaultIdEnum } from '../../../models/category.model'
import {
  CreateForeclosureSaleDto,
  ForeclosureDto,
  ForeclosureModel,
} from '../../../models/foreclosure.model'
import {
  CreateForeclosurePropertyDto,
  ForeclosurePropertyDto,
  ForeclosurePropertyModel,
} from '../../../models/foreclosure-property.model'
import { TypeIdEnum } from '../../../models/type.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import { IForeclosureService } from './foreclosure.service.interface'

@Injectable()
export class ForeclosureService implements IForeclosureService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertService)
    private readonly advertService: IAdvertService,
    @InjectModel(ForeclosureModel)
    private readonly foreclosureModel: typeof ForeclosureModel,
    @InjectModel(ForeclosurePropertyModel)
    private readonly foreclosurePropertyModel: typeof ForeclosurePropertyModel,
  ) {}

  async deleteForclosureSale(id: string): Promise<void> {
    const foreclosure = await this.foreclosureModel.findByPkOrThrow(id)

    await this.advertService.markAdvertAsWithdrawn(foreclosure.advertId)

    await this.foreclosurePropertyModel.destroy({
      where: { foreclosureId: id },
    })

    await foreclosure.destroy()
  }

  async getForeclosureById(id: string): Promise<ForeclosureDto> {
    const foreclosure = await this.foreclosureModel.findByPkOrThrow(id)

    return foreclosure.fromModel()
  }

  async createForeclosureSale(
    body: CreateForeclosureSaleDto,
  ): Promise<ForeclosureDto> {
    this.logger.info('Creating new foreclosure sale')

    const { id: advertId } = await this.advertService.createAdvert({
      typeId: TypeIdEnum.FORECLOSURE,
      categoryId: CategoryDefaultIdEnum.FORECLOSURES,
      title: `Nauðungarsölur - ${body.foreclosureRegion}`,
      createdBy: body.responsibleParty.name,
      createdByNationalId: body.responsibleParty.nationalId,
      signature: {
        name: body.responsibleParty.signature.name,
        date: body.responsibleParty.signature.date,
        location: body.responsibleParty.signature.location,
        onBehalfOf: body.responsibleParty.signature.onBehalfOf,
      },
      scheduledAt: [body.foreclosureDate],
      isFromExternalSystem: true,
    })

    const newForeClosure = await this.foreclosureModel.create(
      {
        advertId: advertId,
        caseNumberIdentifier: body.caseNumberIdentifier,
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
    const newProperty = await this.foreclosurePropertyModel.create(
      {
        foreclosureId: id,
        propertyName: body.propertyName,
        propertyNumber: body.propertyNumber,
        propertyTotalPrice: body.propertyTotalPrice,
        claimant: body.claimant,
        respondent: body.respondent,
      },
      { returning: true },
    )

    await newProperty.reload()

    return newProperty.fromModel()
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
