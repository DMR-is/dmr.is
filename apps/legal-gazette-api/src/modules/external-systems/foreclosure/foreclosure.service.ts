import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { escapeHtml } from '@dmr.is/utils-server/escapeHtml'

import { assertAdvertEditable } from '../../../core/utils/advert-status.util'
import { AdvertModel, AdvertTemplateType } from '../../../models/advert.model'
import { CategoryDefaultIdEnum } from '../../../models/category.model'
import { ForeclosureDto } from '../../../models/foreclosure.dto'
import { ForeclosureModel } from '../../../models/foreclosure.model'
import {
  ForeclosurePropertyDto,
  ForeclosurePropertyModel,
} from '../../../models/foreclosure-property.model'
import { TypeIdEnum } from '../../../models/type.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import {
  CreateForeclosurePropertyDto,
  CreateForeclosureSaleDto,
} from './dto/foreclosure.dto'
import { IForeclosureService } from './foreclosure.service.interface'

const LOGGING_CONTEXT = 'ForeclosureService'
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
    @InjectModel(AdvertModel)
    private readonly advertModel: typeof AdvertModel,
    private readonly sequelize: Sequelize,
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
    this.logger.info('Creating new foreclosure sale', {
      context: LOGGING_CONTEXT,
    })

    // Escape HTML in all text fields to prevent XSS
    const escapedRegion = escapeHtml(body.foreclosureRegion) ?? ''
    const escapedAddress = escapeHtml(body.foreclosureAddress) ?? ''
    const escapedCreatedBy = escapeHtml(body.responsibleParty.name) ?? ''
    const escapedSignatureName =
      escapeHtml(body.responsibleParty.signature.name) ?? ''
    const escapedOnBehalfOf = escapeHtml(
      body.responsibleParty.signature.onBehalfOf,
    )

    // Escape properties
    const escapedProperties = body.properties.map((property) => ({
      ...property,
      propertyName: escapeHtml(property.propertyName) ?? '',
      claimant: escapeHtml(property.claimant) ?? '',
      respondent: escapeHtml(property.respondent) ?? '',
    }))

    const { id: advertId } = await this.advertService.createAdvert({
      typeId: TypeIdEnum.FORECLOSURE,
      categoryId: CategoryDefaultIdEnum.FORECLOSURES,
      templateType: AdvertTemplateType.FORECLOSURE,
      title: `Nauðungarsölur - ${escapedRegion}`,
      createdBy: escapedCreatedBy,
      createdByNationalId: body.responsibleParty.nationalId,
      signature: {
        name: escapedSignatureName,
        date: body.responsibleParty.signature.date,
        location: body.responsibleParty.signature.location,
        onBehalfOf: escapedOnBehalfOf,
      },
      scheduledAt: [body.foreclosureDate],
      isFromExternalSystem: true,
      feeQuantity: body.properties.length,
    })

    const newForeClosure = await this.foreclosureModel.create(
      {
        advertId: advertId,
        caseNumberIdentifier: body.caseNumberIdentifier,
        foreclosureAddress: escapedAddress,
        foreclosureDate: body.foreclosureDate,
        foreclosureRegion: escapedRegion,
        properties: escapedProperties,
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
    // Check advert status before creating property
    const foreclosure = await this.foreclosureModel.findByPkOrThrow(id, {
      include: [
        {
          model: AdvertModel,
          attributes: ['id', 'statusId'],
        },
      ],
    })

    assertAdvertEditable(foreclosure.advert, 'foreclosure property')

    // The property write and the recount commit together, so a failure in
    // between cannot leave the advert billing a stale count.
    const newProperty = await this.sequelize.transaction(
      async (transaction) => {
        // Escape HTML in all text fields to prevent XSS
        const property = await this.foreclosurePropertyModel.create(
          {
            foreclosureId: id,
            propertyName: escapeHtml(body.propertyName) ?? '',
            propertyNumber: body.propertyNumber,
            propertyTotalPrice: body.propertyTotalPrice,
            claimant: escapeHtml(body.claimant) ?? '',
            respondent: escapeHtml(body.respondent) ?? '',
          },
          { returning: true, transaction },
        )

        await this.syncFeeQuantity(id, foreclosure.advertId, transaction)

        return property
      },
    )

    await newProperty.reload()

    return newProperty.fromModel()
  }

  async deletePropertyFromForeclosure(
    id: string,
    propertyNumber: string,
  ): Promise<void> {
    // Check advert status before deleting property
    const foreclosure = await this.foreclosureModel.findByPkOrThrow(id, {
      include: [
        {
          model: AdvertModel,
          attributes: ['id', 'statusId'],
        },
      ],
    })

    assertAdvertEditable(foreclosure.advert, 'foreclosure property')

    const property = await this.foreclosurePropertyModel.findOneOrThrow({
      where: { foreclosureId: id, propertyNumber },
    })

    await this.sequelize.transaction(async (transaction) => {
      // force true (no soft delete)
      await property.destroy({ force: true, transaction })

      await this.syncFeeQuantity(id, foreclosure.advertId, transaction)
    })
  }

  /**
   * A foreclosure is billed per property, and the quantity is set on the
   * advert when the sale is created. Recount after every property change so
   * the charge at publication matches what is published.
   */
  private async syncFeeQuantity(
    foreclosureId: string,
    advertId: string,
    transaction: Transaction,
  ): Promise<void> {
    const feeQuantity = await this.foreclosurePropertyModel.count({
      where: { foreclosureId },
      transaction,
    })

    // Once publication A is out the advert has been charged; its quantity is
    // the record of what TBR billed and is not rewritten.
    await this.advertModel.update(
      { feeQuantity },
      { where: { id: advertId, transactionId: null }, transaction },
    )
  }
}
