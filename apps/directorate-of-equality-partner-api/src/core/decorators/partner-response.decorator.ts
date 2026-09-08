/**
 * Swagger response helper, copied from the sibling app's `DoeResponse`.
 *
 * Copied rather than shared: it is a presentation concern belonging to whichever
 * app publishes the document, and this document is a contract with external
 * integrators that will diverge from the internal one — error sets and status
 * codes included. Sharing it would couple the public contract's shape to the
 * admin API's.
 */
import { applyDecorators } from '@nestjs/common'
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { ApiErrorDto } from '@dmr.is/shared-dto'

/**
 * 409 is in the default set because `RequireActiveCompanyGuard` is declared on
 * the whole controller: every route can refuse a company that has fallen off
 * Jafnréttisstofa's register. The submissions carry two more conflicts of their
 * own — the renewal window, and a previous report still in review — which the
 * routes had never declared.
 */
const DEFAULT_ERRORS = [400, 401, 403, 409, 500]

type PartnerResponseParams = {
  operationId: string
  description?: string
  status?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: any
  successDescription?: string
  /**
   * Content type the success response produces (e.g. `text/html`,
   * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
   *
   * Use this instead of `@ApiProduces` on file/html endpoints. `@ApiProduces`
   * is operation-wide and would mis-tag the JSON `ApiErrorDto` error responses
   * with the same MIME type; setting `content` on the success response only
   * keeps errors as `application/json`.
   */
  produces?: string
  errors?: number[]
  include404?: boolean
  /**
   * A second success status this route can answer with, documented alongside
   * the first and carrying the same `type`.
   *
   * Exists for the submissions, which answer `201` when they file a report and
   * `200` when the `providerId` had already been used and nothing was created.
   * Publishing both is the point: a generated client that only knows about
   * `201` is a client that cannot tell a filed report from a replayed one.
   */
  alsoSucceedsWith?: { status: number; description: string }
}

function buildSuccessContentSchema(produces: string) {
  return produces.startsWith('text/')
    ? { type: 'string' as const }
    : { type: 'string' as const, format: 'binary' }
}

export function PartnerResponse({
  operationId,
  status = 200,
  type,
  description,
  successDescription,
  produces,
  errors = DEFAULT_ERRORS,
  include404 = false,
  alsoSucceedsWith,
}: PartnerResponseParams) {
  let successDecorator: ReturnType<typeof ApiResponse>

  if (produces) {
    successDecorator = ApiResponse({
      status,
      description: successDescription,
      content: {
        [produces]: { schema: buildSuccessContentSchema(produces) },
      },
    })
  } else if (type || successDescription) {
    successDecorator = ApiResponse({
      status,
      type,
      description: successDescription,
    })
  } else {
    successDecorator = ApiNoContentResponse()
  }

  const effectiveErrors = include404 ? [...errors, 404] : errors

  return applyDecorators(
    ApiOperation({ operationId, description }),
    successDecorator,
    ...(alsoSucceedsWith
      ? [
          ApiResponse({
            status: alsoSucceedsWith.status,
            type,
            description: alsoSucceedsWith.description,
          }),
        ]
      : []),
    ...effectiveErrors.map((code) =>
      ApiResponse({ status: code, type: ApiErrorDto }),
    ),
  )
}
