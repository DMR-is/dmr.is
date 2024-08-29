import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common'
import { isDefined, isEnum } from 'class-validator'

@Injectable()
export class EnumValidationPipe implements PipeTransform {
  constructor(private readonly enumType: any) {}
  async transform(value: any, metadata: ArgumentMetadata) {
    if (isDefined(value) && isEnum(value, this.enumType)) {
      return value
    }

    throw new BadRequestException(
      `Parameter <${value}> is not a valid value for enum <${
        metadata.data
      }>, valid values are: ${Object.values(this.enumType)}`,
    )
  }
}
