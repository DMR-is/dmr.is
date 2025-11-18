import {
  TBRGetPaymentQueryDto,
  TBRGetPaymentResponseDto,
  TBRPostPaymentBodyDto,
} from './tbr.dto'

export interface ITBRService {
  postPayment(body: TBRPostPaymentBodyDto): Promise<void>
  getPaymentStatus(
    query: TBRGetPaymentQueryDto,
  ): Promise<TBRGetPaymentResponseDto>
}

export const ITBRService = Symbol('ITBRService')
