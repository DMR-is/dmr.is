export interface IPriceCalculatorService {
  calculateAdvertPrice(advertId: string): Promise<number>
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')
