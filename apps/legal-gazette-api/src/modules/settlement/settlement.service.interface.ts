import { UpdateSettlementDto } from './dto/settlement.dto'

export interface ISettlementService {
  updateSettlement(id: string, body: UpdateSettlementDto): Promise<void>
}

export const ISettlementService = Symbol('ISettlementService')
