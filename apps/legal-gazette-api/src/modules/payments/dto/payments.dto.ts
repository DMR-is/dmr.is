import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiString,
} from '@dmr.is/decorators'
import { Paging } from '@dmr.is/shared-dto'

import {
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../../models/tbr-transactions.model'
import { QueryDto } from '../../shared/dto/query.dto'

export class GetPaymentsQuery extends QueryDto {
  @ApiOptionalEnum(TBRTransactionType, {
    enumName: 'TBRTransactionType',
  })
  type?: TBRTransactionType

  @ApiOptionalEnum(TBRTransactionStatus, {
    enumName: 'TBRTransactionStatus',
  })
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
  @ApiString()
  id!: string

  @ApiEnum(TBRTransactionType, { enumName: 'TBRTransactionType' })
  type!: TBRTransactionType

  @ApiEnum(TBRTransactionStatus, { enumName: 'TBRTransactionStatus' })
  status!: TBRTransactionStatus

  @ApiProperty({ type: Number })
  totalPrice!: number

  @ApiString()
  debtorNationalId!: string

  @ApiOptionalDateTime({ nullable: true })
  paidAt!: Date | null

  @ApiDateTime()
  createdAt!: Date

  @ApiString()
  chargeBase!: string

  @ApiString()
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
