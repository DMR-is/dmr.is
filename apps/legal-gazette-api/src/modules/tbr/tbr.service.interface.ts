import {
  TBRGetPaymentQueryDto,
  TBRGetPaymentResponseDto,
  TBRPostPaymentBodyDto,
} from './tbr.dto'

export interface ITBRService {
  postPayment(body: TBRPostPaymentBodyDto): Promise<void>
  getPaymentStatus(
    query: TBRGetPaymentQueryDto,
    index?: number,
  ): Promise<TBRGetPaymentResponseDto>
}

export const ITBRService = Symbol('ITBRService')
