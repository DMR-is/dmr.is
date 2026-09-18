import { Op } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { PostcodeDto } from './dto/postcode.dto'
import { RegionDto } from './dto/region.dto'
import { PostcodeModel } from './models/postcode.model'
import { RegionModel } from './models/region.model'
import { ILocationService } from './location.service.interface'

@Injectable()
export class LocationService implements ILocationService {
  constructor(
    @InjectModel(RegionModel)
    private readonly regionModel: typeof RegionModel,
    @InjectModel(PostcodeModel)
    private readonly postcodeModel: typeof PostcodeModel,
  ) {}

  async getRegions(): Promise<RegionDto[]> {
    const regions = await this.regionModel.findAll({ order: [['name', 'ASC']] })
    return regions.map((region) => region.fromModel())
  }

  /**
   * All postcodes, optionally narrowed to the given regions (by region code).
   * The region filter is an inner-join on the region the postcode rolls up
   * into — this is what lets the UI shrink the postcode options once a region
   * is picked.
   */
  async getPostcodes(regionCodes?: string[]): Promise<PostcodeDto[]> {
    const postcodes = await this.postcodeModel.findAll({
      order: [['code', 'ASC']],
      ...(regionCodes?.length
        ? {
            include: [
              {
                model: RegionModel,
                as: 'region',
                attributes: [],
                required: true,
                where: { code: { [Op.in]: regionCodes } },
              },
            ],
          }
        : {}),
    })
    return postcodes.map((postcode) => postcode.fromModel())
  }
}
