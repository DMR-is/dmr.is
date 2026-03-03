import { IsNumber } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApiString } from '@dmr.is/decorators'

export class TBRGetPaymentResponseDto {
  @ApiProperty({ type: Boolean })
  paid!: boolean

  @ApiProperty({ type: Boolean })
  created!: boolean

  @ApiProperty({ type: Boolean })
  canceled!: boolean

  @ApiProperty({ type: Number })
  capital!: number
}

export class TBRGetPaymentQueryDto {
  @ApiProperty({ type: String })
  debtorNationalId!: string

  @ApiProperty({ type: String })
  chargeBase!: string

  @ApiProperty({ type: String })
  chargeCategory!: string
}

export class TBRPaymentExpensesDto {
  @ApiString()
  feeCode!: string

  @ApiString()
  reference!: string

  @ApiProperty({ type: Number })
  @IsNumber()
  quantity!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  unitPrice!: number

  @ApiProperty({ type: Number })
  @IsNumber()
  sum!: number
}

export class TBRPostPaymentBodyDto {
  @ApiProperty({ type: String, description: 'Advert id or Subscriber id' })
  id!: string
  // advertId is deprecated, use id instead

  @ApiProperty({ type: String, description: 'Charge category' })
  chargeCategory!: string

  @ApiProperty({ type: String, description: 'Charge base (Case number)' })
  chargeBase!: string

  @ApiProperty({
    type: String,
    description:
      'National id of the debtor (advert responsible entity national id)',
  })
  debtorNationalId!: string

  @ApiProperty({
    type: [TBRPaymentExpensesDto],
    description: 'List of expenses',
  })
  expenses!: TBRPaymentExpensesDto[]
}

export class GetPaymentDataResponseDto {
  feeCodeId!: string

  paymentData!: TBRPostPaymentBodyDto
}
