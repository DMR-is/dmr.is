import { logger } from '@dmr.is/logging'
import { HttpException } from '@nestjs/common'

export type AdminUserRoleTitle = 'Admin' | 'Editor'

export type GenericError = { code: number; message: string }

export type Ok<T> = { ok: true; value: T }
export type Err<T> = { ok: false; error: T }

export type Result<
  OkType = unknown,
  ErrType extends GenericError = GenericError,
> = Ok<OkType> | Err<ErrType>

export class ResultWrapper<
  OkType = unknown,
  ErrType extends { message: string; code: number } = GenericError,
> {
  public result: Result<OkType, ErrType>

  constructor(result: Result<OkType, ErrType>) {
    this.result = result
  }

  static ok = <OkType, ErrType extends GenericError>(
    value?: OkType,
  ): ResultWrapper<OkType, ErrType> => {
    return new ResultWrapper<OkType, ErrType>({
      ok: true,
      value: value ? value : (undefined as unknown as OkType),
    })
  }

  static err = <OkType, ErrType extends GenericError>(
    error: ErrType,
  ): ResultWrapper<OkType, ErrType> => {
    return new ResultWrapper<OkType, ErrType>({ ok: false, error })
  }

  static isOk<OkType, ErrType extends GenericError>(
    result: Result<OkType, ErrType>,
  ): result is Ok<OkType> {
    return result.ok
  }

  static unwrap<OkType, ErrType extends GenericError = GenericError>(
    result: ResultWrapper<OkType, ErrType>,
  ): OkType {
    return result.unwrap()
  }

  isOk(): boolean {
    return this.result.ok
  }

  unwrap(): OkType {
    if (this.result.ok) {
      return this.result.value
    }

    logger.debug(`Error unwrapping result, ${this.result.error.message}`)
    throw new HttpException(this.result.error.message, this.result.error.code)
  }
}
