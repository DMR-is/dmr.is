import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * One named field of a `multipart/form-data` body, as the raw string multer
 * parsed it. Pair it with `JsonPartPipe`, which parses and validates it.
 *
 * Why not `@Body('payload', pipe)`: global pipes run BEFORE param pipes, and
 * the global `ValidationPipe` takes its metatype from the parameter's type
 * annotation — the DTO, not `String`. So it validated the unparsed string
 * against the DTO and refused every submission with every field's error, before
 * `JsonPartPipe` ever saw it. A custom param decorator is skipped by the global
 * pipe (`validateCustomDecorators` is off), which leaves validation to the one
 * pipe built for it.
 */
export const FormPart = createParamDecorator(
  (part: string, ctx: ExecutionContext): unknown =>
    ctx.switchToHttp().getRequest()?.body?.[part],
)
