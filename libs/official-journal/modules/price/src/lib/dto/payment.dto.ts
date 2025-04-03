import { Transform } from 'class-transformer'
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class PaymentExtraData {
  @ApiProperty({
    type: String,
    description: 'Extra data name',
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    description: 'Extra data information',
  })
  @IsString()
  value!: string
}

export class PaymentExpenses {
  @ApiProperty({
    type: String,
    description: 'Fee code for expense',
  })
  @IsString()
  FeeCode!: string

  @ApiProperty({
    type: String,
    description: 'Expense reference',
  })
  @IsString()
  Reference!: string

  @ApiProperty({
    type: Number,
    description: 'How many of this fee code expense',
  })
  @IsNumber()
  Quantity!: number

  @ApiProperty({
    type: Number,
    description: 'How much is a single unit of this expense',
  })
  @IsNumber()
  UnitPrice!: number

  @ApiProperty({
    type: Number,
    description: 'Total of this expense (Quantity * UnitPrice)',
  })
  @IsNumber()
  Sum!: number
}

export class PostExternalPaymentBody {
  @ApiProperty({
    type: String,
    description: 'Case id',
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'Payment charge base (same as caseNumber)',
  })
  @IsString()
  chargeBase!: string

  @ApiProperty({
    type: String,
    description: 'National id of the debtor',
  })
  @IsString()
  debtorNationalId!: string

  @ApiProperty({
    type: [PaymentExtraData],
    description:
      'Extra info for payment. Not available yet. Waiting for service provider update.',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  extra?: PaymentExtraData[]

  @ApiProperty({
    type: [PaymentExpenses],
    description: 'Payment expense array',
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  Expenses!: PaymentExpenses[]
}
