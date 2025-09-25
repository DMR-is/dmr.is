import { TBRPostPaymentBodyDto } from '../../tbr/dto/tbr.dto'

export class GetPaymentDataResponseDto {
  feeCodeId!: string

  paymentData!: TBRPostPaymentBodyDto
}
