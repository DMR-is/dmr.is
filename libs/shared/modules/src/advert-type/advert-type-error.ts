import { HttpException } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export enum AdvertTypeErrorSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

enum ErrType {
  DuplicateError = 'DuplicateError',
  ValidationError = 'ValidationError',
  NotFoundError = 'NotFoundError',
}

export class AdvertTypeError extends HttpException {
  @ApiProperty({
    enum: ErrType,
  })
  public errorType!: ErrType

  @ApiProperty({
    type: String,
  })
  public override name!: string

  @ApiProperty({
    type: String,
  })
  public override message!: string

  @ApiProperty({
    enum: AdvertTypeErrorSeverity,
  })
  public severity: AdvertTypeErrorSeverity

  constructor(message: string, status: number) {
    super(message, status)
    this.message = message
    this.severity =
      status >= 500
        ? AdvertTypeErrorSeverity.Error
        : AdvertTypeErrorSeverity.Warning
    this.name = status >= 500 ? 'Villa kom upp í vefþjóni' : 'Ógild beiðni'
  }
}

export class AdvertTypeDuplicateError extends AdvertTypeError {
  constructor(message: string) {
    super(message, 409)
    this.errorType = ErrType.DuplicateError
  }
}

export class AdvertTypeValidationError extends AdvertTypeError {
  constructor(message: string) {
    super(message, 400)
    this.errorType = ErrType.ValidationError
  }
}

export class AdvertTypeNotFoundError extends AdvertTypeError {
  constructor(message: string) {
    super(message, 404)
    this.errorType = ErrType.NotFoundError
  }
}
