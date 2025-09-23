export interface IPriceCalculatorService {
  calculate(): Promise<number>
}

export const IPriceCalculatorService = Symbol('IPriceCalculatorService')
