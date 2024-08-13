import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { isUUID } from 'class-validator'

@Injectable()
export class UUIDValidationPipe implements PipeTransform {
  async transform(value: any) {
    if (!isUUID(value)) {
      throw new BadRequestException(`Parameter <${value}> is not a valid UUID`)
    }
    return value
  }
}
