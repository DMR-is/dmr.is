/* eslint-disable @typescript-eslint/no-explicit-any */

import { isValid } from 'kennitala'

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class NationalIdValidationPipe implements PipeTransform {
  async transform(value: any) {
    if (!isValid(value)) {
      throw new BadRequestException(
        `Parameter <${value}> is not a valid National ID`,
      )
    }

    return value
  }
}
