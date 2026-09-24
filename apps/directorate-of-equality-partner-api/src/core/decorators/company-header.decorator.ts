import { ApiHeader } from '@nestjs/swagger'

/**
 * Documents `X-Company-National-Id` on every route that acts for a company.
 *
 * Optional in the document because it is optional by key kind: a vendor client
 * key must send it and a company key must not. Swagger has no way to say that,
 * so the description does.
 */
export const ApiCompanyHeader = () =>
  ApiHeader({
    name: 'X-Company-National-Id',
    required: false,
    description:
      'Vendor client keys only: the kennitala of the company you are acting for, which must have granted your organisation a delegation. Omit it with a company key — that key already names its company, and sending the header is a `400`.',
  })
