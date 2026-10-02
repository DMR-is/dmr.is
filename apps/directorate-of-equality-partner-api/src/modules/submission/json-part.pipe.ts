import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
  ValidationPipe,
} from '@nestjs/common'

import { PARTNER_VALIDATION_OPTIONS } from '../../validation-options'

/**
 * Parses and validates the JSON part of a `multipart/form-data` submission.
 *
 * A multipart part is a string, and the global `ValidationPipe` cannot be the
 * one to check it: it runs before any param pipe, takes its metatype from the
 * parameter's DTO annotation, and would validate the unparsed string against
 * the DTO — refusing every submission. So the part is read with `@FormPart`,
 * which the global pipe skips, and this pipe does the whole job. Without it the
 * document route would accept bodies the JSON routes reject — the fourth
 * occurrence of "previews clean, rejected at submit" in this codebase.
 *
 * It therefore does not implement any validation of its own. It parses, then
 * hands the object to a real `ValidationPipe` built from
 * `PARTNER_VALIDATION_OPTIONS` — the same options `bootstrap` gives the global
 * pipe. Same rules, by construction rather than by agreement: `whitelist` and
 * `forbidNonWhitelisted` apply here exactly as they do on a JSON body, so an
 * unknown field inside the part is still a `400` naming it.
 *
 * Why two parts rather than fifteen form fields: the payload keeps nested
 * `company` and `subsidiaries[]` in JSON, so every existing validator on
 * `SubmitEqualityReportDto` applies unchanged. Flattening the object into form
 * fields would have meant re-expressing that structure in a shape
 * class-validator cannot see.
 */
@Injectable()
export class JsonPartPipe<T extends object> implements PipeTransform {
  private readonly validation = new ValidationPipe(PARTNER_VALIDATION_OPTIONS)

  constructor(
    private readonly metatype: Type<T>,
    /** The part's name, so a refusal names the thing the vendor sent. */
    private readonly part: string,
  ) {}

  async transform(value: unknown, _metadata: ArgumentMetadata): Promise<T> {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(
        `The "${this.part}" part is missing. Send the report fields as a JSON object in a form part named "${this.part}", alongside the document`,
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(value)
    } catch {
      // Deliberately not passing the parser's message through. It names byte
      // offsets into a part the vendor did not necessarily assemble by hand,
      // and it is our dependency's wording rather than our contract.
      throw new BadRequestException(`The "${this.part}" part is not valid JSON`)
    }

    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new BadRequestException(
        `The "${this.part}" part must be a JSON object`,
      )
    }

    return this.validation.transform(parsed, {
      type: 'body',
      metatype: this.metatype,
    }) as Promise<T>
  }
}
