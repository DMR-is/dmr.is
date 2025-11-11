import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IAdvertService } from '../advert/advert.service.interface'
import { CategoryDefaultIdEnum } from '../../models/category.model'
import { TypeIdEnum } from '../../models/type.model'
import {
  CreateForeclosurePropertyDto,
  CreateForeclosureSaleDto,
  ForeclosureDto,
  ForeclosurePropertyDto,
} from './dto/foreclosure.dto'
import { ForeclosureModel } from '../../models/foreclosure.model'
import { IForeclosureService } from './foreclosure.service.interface'
import { ForeclosurePropertyModel } from '../../models/foreclosure-property.model'

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
      signatureName: body.responsibleParty.signatureName,
      signatureLocation: body.responsibleParty.signatureLocation,
      signatureDate: body.responsibleParty.signatureDate,
      scheduledAt: [body.foreclosureDate],
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
