import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared/dto'

import {
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../models/tbr-transactions.model'
import { QueryDto } from './query.dto'

export class GetPaymentsQuery extends QueryDto {}

export class PaymentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ enum: TBRTransactionType, enumName: 'TBRTransactionType' })
  type!: TBRTransactionType

  @ApiProperty({ enum: TBRTransactionStatus, enumName: 'TBRTransactionStatus' })
  status!: TBRTransactionStatus

  @ApiProperty({ type: Number })
  totalPrice!: number

  @ApiProperty({ type: String })
  debtorNationalId!: string

  @ApiProperty({ type: String, nullable: true })
  paidAt!: string | null

  @ApiProperty({ type: String })
  createdAt!: string

  @ApiProperty({ type: String })
  chargeBase!: string

  @ApiProperty({ type: String })
  chargeCategory!: string

  @ApiProperty({ type: String, nullable: true })
  tbrReference!: string | null

  @ApiProperty({ type: String, nullable: true })
  tbrError!: string | null
}

export class GetPaymentsDto {
  @ApiProperty({ type: () => [PaymentDto] })
  payments!: PaymentDto[]

  @ApiProperty({ type: () => Paging })
  paging!: Paging
}
