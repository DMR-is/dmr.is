import { IsBase64, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

/**
 * An optional binary file carried as base64, stored and forwarded **verbatim**.
 *
 * ⚠️ **The absence of a `Transform` is the entire point of this decorator — do
 * not add one.** `ApiHTML` / `ApiOptionalHTML` look like the neighbouring
 * choice and are not: they base64-decode into a *utf-8 string*, which is
 * lossless only for text. Run binary through that and every byte outside valid
 * utf-8 is replaced with U+FFFD, so the payload arrives corrupt — and corrupt
 * in a way nothing notices until something far downstream tries to parse the
 * file.
 *
 * So the value stays a base64 string for its whole life here: validated as
 * base64, persisted as base64, handed back as base64. Decoding is the job of
 * whoever actually reads the bytes, at the point they read them.
 *
 * `IsBase64` rather than a bare `IsString` because a non-base64 value cannot be
 * a file, and rejecting it at the DTO gives the caller a field-level error
 * instead of an opaque failure later.
 */
export function ApiOptionalBase64File(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      description: 'File contents encoded as base64',
      ...options,
      type: String,
      required: false,
    }),
    IsOptional(),
    IsBase64(),
  )
}
