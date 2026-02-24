import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'

import {
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../models/tbr-transactions.model'
import { QueryDto } from './query.dto'

export class GetPaymentsQuery extends QueryDto {
  @ApiProperty({
    enum: TBRTransactionType,
    enumName: 'TBRTransactionType',
    required: false,
  })
  @IsOptional()
  @IsEnum(TBRTransactionType)
  type?: TBRTransactionType

  @ApiProperty({
    enum: TBRTransactionStatus,
    enumName: 'TBRTransactionStatus',
    required: false,
  })
  @IsOptional()
  @IsEnum(TBRTransactionStatus)
  status?: TBRTransactionStatus

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  paid?: boolean
}

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

export class SyncPaymentsResponseDto {
  @ApiProperty({ type: Number, description: 'Number of transactions processed' })
  processed!: number

  @ApiProperty({ type: Number, description: 'Number of transactions updated to paid' })
  updated!: number

  @ApiProperty({ type: Number, description: 'Number of transactions that failed to sync' })
  failed!: number
}
