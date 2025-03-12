import { isUUID } from 'class-validator'

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class UUIDValidationPipe implements PipeTransform {
  constructor(private readonly isOptional = false) {}
  async transform(value: any) {
    if (!isUUID(value) && !this.isOptional) {
      throw new BadRequestException(`Parameter <${value}> is not a valid UUID`)
    }

    return value
  }
}
