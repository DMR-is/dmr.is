/* eslint-disable @typescript-eslint/no-explicit-any */
import Kennitala from 'kennitala'

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class NationalIdValidationPipe implements PipeTransform {
  async transform(value: any) {
    if (!Kennitala.isValid(value)) {
      throw new BadRequestException(
        `Parameter <${value}> is not a valid National ID`,
      )
    }

    return value
  }
}
