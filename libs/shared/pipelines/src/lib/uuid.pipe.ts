import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { isUUID } from 'class-validator'

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
