import { UpdateSettlementDto } from '../../models/settlement.model'

export interface ISettlementService {
  updateSettlement(id: string, body: UpdateSettlementDto): Promise<void>
}

export const ISettlementService = Symbol('ISettlementService')
