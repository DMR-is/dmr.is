import { ForbiddenException } from '@nestjs/common'

import { asStaffToken } from './staff-token.testing'
import { ADMIN_ACCESS_REQUIRED, assertStaffToken } from './token-surface'

jest.mock('@dmr.is/logging', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
  return { ...jest.requireActual('@dmr.is/logging'), getLogger: () => logger }
})

describe('assertStaffToken', () => {
  describe('actor', () => {
    it('accepts an actor that is undefined', () => {
      expect(() =>
        assertStaffToken(asStaffToken({ actor: undefined })),
      ).not.toThrow()
    })

    // TokenJwtAuthGuard turns a falsy actor into undefined, so these never
    // reach the guard. They pin this function's own contract: any actor that
    // is not undefined is refused, so a truthy or `!= null` check fails here.
    it.each([
      ['null', null],
      ['an empty string', ''],
      ['0', 0],
      ['false', false],
    ])('refuses an actor that is %s', (_, actor) => {
      expect(() => assertStaffToken(asStaffToken({ actor }))).toThrow(
        new ForbiddenException(ADMIN_ACCESS_REQUIRED),
      )
    })
  })
})
