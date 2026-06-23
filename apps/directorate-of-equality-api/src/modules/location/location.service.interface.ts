import { PostcodeDto } from './dto/postcode.dto'
import { RegionDto } from './dto/region.dto'

export interface ILocationService {
  getRegions(): Promise<RegionDto[]>
  getPostcodes(regionCodes?: string[]): Promise<PostcodeDto[]>
}

export const ILocationService = Symbol('ILocationService')
