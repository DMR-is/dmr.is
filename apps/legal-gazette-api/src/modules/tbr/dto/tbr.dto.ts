import { IsNumber, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

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
}

export class TBRPaymentExpensesDto {
  @ApiProperty({ type: String })
  @IsString()
  feeCode!: string

  @ApiProperty({ type: String })
  @IsString()
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
  @ApiProperty({ type: String, description: 'Advert id' })
  advertId!: string

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
