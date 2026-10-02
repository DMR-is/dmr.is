import { json, urlencoded } from 'express'

import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'

import { applyApiRouting } from './api-routing'
import { MAX_PARTNER_JSON_BYTES } from './request-limits'
import { PARTNER_VALIDATION_OPTIONS } from './validation-options'

/**
 * Everything `bootstrap` does to the app before it listens, apart from logging,
 * swagger and APM. Split out so an HTTP-level spec runs requests through the
 * exact body limits, global pipe and routing production uses. The equality
 * route once refused every submission while its spec, which called the handler
 * directly and never met the global pipe, stayed green.
 */
export const configureApp = (app: NestExpressApplication): void => {
  // One proxy in front: the ALB. Without this, `req.ip` is the socket peer --
  // the ALB itself -- so the per-IP throttler would collapse every caller in
  // the world into a single bucket, and one flood would throttle everyone.
  //
  // The count must be exact rather than `true`. Trusting the whole chain would
  // let a caller prepend its own X-Forwarded-For and rotate a fake address per
  // request, which defeats the limit silently. At 1, Express takes the entry the
  // ALB appended, which is the real peer and not client-supplied. If a CDN is
  // ever put in front of this service, this number changes with it.
  app.set('trust proxy', 1)

  // A submitted salary report carries the whole scoring payload inline — every
  // employee row, every criterion — and a large employer's runs to megabytes.
  // There is no upload route to take it off the request path: this surface
  // replaces the workbook rather than transporting one, so the payload arrives
  // as JSON on the submission itself. 8mb rather than the sibling app's 6mb
  // because there is no island.is payload cap in front of this one — a vendor
  // posts the report whole.
  app.use(json({ limit: MAX_PARTNER_JSON_BYTES }))
  app.use(urlencoded({ extended: true, limit: MAX_PARTNER_JSON_BYTES }))

  // Shared with the multipart equality route's own pipe — see
  // `PARTNER_VALIDATION_OPTIONS`. One definition, so the two paths cannot drift.
  app.useGlobalPipes(new ValidationPipe(PARTNER_VALIDATION_OPTIONS))

  applyApiRouting(app)
}
