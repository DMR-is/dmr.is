import { UniqueConstraintError, ValidationError } from 'sequelize'

import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'

import {
  isReportIdentifierCollision,
  REPORT_IDENTIFIER_INDEX,
  rethrowReportWriteError,
} from './report-identifier'

/** A Sequelize unique violation as Postgres reports it, naming `constraint`. */
const uniqueViolation = (constraint: string) => {
  const error = new UniqueConstraintError({})
  // `parent` is the underlying pg error; the constraint name is the only thing
  // distinguishing which index rejected the write.
  Object.defineProperty(error, 'parent', {
    value: Object.assign(new Error('duplicate key value'), { constraint }),
  })
  return error
}

describe('report identifier write errors', () => {
  describe('isReportIdentifierCollision', () => {
    it('recognises a violation of the identifier index', () => {
      expect(
        isReportIdentifierCollision(uniqueViolation(REPORT_IDENTIFIER_INDEX)),
      ).toBe(true)
    })

    it('ignores a violation of a different unique index', () => {
      // The provider-tuple index is handled as an idempotent replay in
      // `ReportDraftService.createDraft`, so conflating the two would turn a
      // real collision into a silent "return the winner".
      expect(
        isReportIdentifierCollision(
          uniqueViolation('report_provider_type_provider_id_unique_idx'),
        ),
      ).toBe(false)
    })

    it('ignores a unique violation with no constraint name', () => {
      expect(isReportIdentifierCollision(new UniqueConstraintError({}))).toBe(
        false,
      )
    })

    it.each([
      ['a different Sequelize error', new ValidationError('nope', [])],
      ['a plain Error', new Error('boom')],
      ['a non-error', 'boom'],
    ])('ignores %s', (_label, error) => {
      expect(isReportIdentifierCollision(error)).toBe(false)
    })
  })

  describe('rethrowReportWriteError', () => {
    it('turns an identifier collision into a retryable 503', () => {
      // Not a 400. SequelizeExceptionFilter maps every UniqueConstraintError to
      // 400, which tells island.is the payload was bad and must not be retried —
      // on a report submit that is a silently dropped submission.
      expect(() =>
        rethrowReportWriteError(uniqueViolation(REPORT_IDENTIFIER_INDEX)),
      ).toThrow(ServiceUnavailableException)
    })

    it('rethrows anything else untouched, preserving the original error', () => {
      const original = new UnauthorizedException()

      expect(() => rethrowReportWriteError(original)).toThrow(original)
    })

    it('rethrows another index violation as the Sequelize error it was', () => {
      // Must stay a UniqueConstraintError so the provider-tuple replay handler
      // upstream still recognises it.
      const original = uniqueViolation(
        'report_provider_type_provider_id_unique_idx',
      )

      expect(() => rethrowReportWriteError(original)).toThrow(
        UniqueConstraintError,
      )
    })
  })
})
