import { TBRPostPaymentBodyDto } from '../../../dto/tbr.dto'

export class GetPaymentDataResponseDto {
  feeCodeId!: string

  paymentData!: TBRPostPaymentBodyDto
}
