import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class ParseNationalIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const normalized = value.replace(/[- ]/g, '')

    if (!/^\d{10}$/.test(normalized)) {
      throw new BadRequestException(
        'nationalId must be 10 digits (accepted formats: XXXXXXXXXX, XXXXXX-XXXX, XXXXXX XXXX)',
      )
    }

    return normalized
  }
}
