import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { isString } from 'class-validator'

@Injectable()
export class IsStringValidationPipe implements PipeTransform {
  async transform(value: any) {
    if (!isString(value)) {
      throw new BadRequestException(`Missing or invalid parameter value`)
    }
    return value
  }
}
