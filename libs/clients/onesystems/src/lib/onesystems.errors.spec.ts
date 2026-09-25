import { inspect } from 'node:util'

import {
  isDefinitiveOneSystemsFailure,
  isDefinitiveOneSystemsFailureGiven,
  ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS,
  OneSystemsError,
  type OneSystemsErrorDetails,
  type OneSystemsOperation,
  toLoggableErrorNumber,
  WITHHELD_ERROR_NUMBER,
} from './onesystems.errors'

const error = (details: OneSystemsErrorDetails) =>
  new OneSystemsError('test', details)

describe('isDefinitiveOneSystemsFailure', () => {
  const allOperations: Array<OneSystemsOperation> = [
    'Login',
    'CreateCase',
    'CreateDocument',
    'SendDocToIslandIs',
    'CloseCase',
  ]

  it('is false for anything that is not a OneSystemsError', () => {
    expect(isDefinitiveOneSystemsFailure(new Error('x'))).toBe(false)
    expect(isDefinitiveOneSystemsFailure(undefined)).toBe(false)
  })

  it.each(allOperations)(
    '%s: CONFIG and INVALID_INPUT are definitive (nothing was sent)',
    (operation) => {
      expect(
        isDefinitiveOneSystemsFailure(error({ operation, reason: 'CONFIG' })),
      ).toBe(true)
      expect(
        isDefinitiveOneSystemsFailure(
          error({ operation, reason: 'INVALID_INPUT' }),
        ),
      ).toBe(true)
    },
  )

  it.each(['TRANSPORT', 'UNEXPECTED_RESPONSE', 'HTTP', 'REJECTED'] as const)(
    'Login: %s is definitive (the action was never sent)',
    (reason) => {
      expect(
        isDefinitiveOneSystemsFailure(
          error({ operation: 'Login', reason, upstreamStatus: 500 }),
        ),
      ).toBe(true)
    },
  )

  describe.each(['CreateCase', 'CloseCase'] as const)('%s', (operation) => {
    it.each([
      [{ reason: 'REJECTED', upstreamStatus: 200 }, true],
      [
        { reason: 'HTTP', upstreamStatus: 400, hasGeneralResponseBody: true },
        true,
      ],
      [{ reason: 'HTTP', upstreamStatus: 409 }, true],
      [{ reason: 'HTTP', upstreamStatus: 429 }, true],
      // Idempotent: a 4xx is definitive with or without One's body.
      [
        { reason: 'HTTP', upstreamStatus: 401, hasGeneralResponseBody: true },
        true,
      ],
      [
        { reason: 'HTTP', upstreamStatus: 403, hasGeneralResponseBody: true },
        true,
      ],
      // Empty 401/403/404: still definitive for a call that is safe to repeat.
      [{ reason: 'HTTP', upstreamStatus: 401, hasEmptyBody: true }, true],
      [{ reason: 'HTTP', upstreamStatus: 403, hasEmptyBody: true }, true],
      [{ reason: 'HTTP', upstreamStatus: 404, hasEmptyBody: true }, true],
      [{ reason: 'HTTP', upstreamStatus: 500 }, false],
      [{ reason: 'HTTP' }, false],
      [{ reason: 'TRANSPORT' }, false],
      [{ reason: 'UNEXPECTED_RESPONSE', upstreamStatus: 200 }, false],
    ] as const)('%o is definitive=%s', (details, definitive) => {
      expect(
        isDefinitiveOneSystemsFailure(error({ operation, ...details })),
      ).toBe(definitive)
    })
  })

  describe.each(['CreateDocument', 'SendDocToIslandIs'] as const)(
    '%s',
    (operation) => {
      it.each([
        // (a) Only the JwtBearer challenge, an empty 401 WITH a Bearer
        // WWW-Authenticate, proves the pipeline rejected it before the action.
        [
          {
            reason: 'HTTP',
            upstreamStatus: 401,
            hasEmptyBody: true,
            hasBearerChallenge: true,
          },
          true,
        ],
        // An empty 401 without the header is an in-action Unauthorized(null).
        [{ reason: 'HTTP', upstreamStatus: 401, hasEmptyBody: true }, false],
        // The flag alone, without an empty body, is not enough.
        [
          { reason: 'HTTP', upstreamStatus: 401, hasBearerChallenge: true },
          false,
        ],
        // An empty 403 (Forbid() goes through the auth handler) or 404
        // (NotFound(null)) can come from inside the action.
        [{ reason: 'HTTP', upstreamStatus: 403, hasEmptyBody: true }, false],
        [{ reason: 'HTTP', upstreamStatus: 404, hasEmptyBody: true }, false],
        [
          {
            reason: 'HTTP',
            upstreamStatus: 403,
            hasEmptyBody: true,
            hasBearerChallenge: true,
          },
          false,
        ],
        [
          {
            reason: 'HTTP',
            upstreamStatus: 404,
            hasEmptyBody: true,
            hasBearerChallenge: true,
          },
          false,
        ],
        // A body-read failure is TRANSPORT, whatever the status.
        [{ reason: 'TRANSPORT', upstreamStatus: 400 }, false],
        [
          {
            reason: 'TRANSPORT',
            upstreamStatus: 401,
            hasEmptyBody: true,
            hasBearerChallenge: true,
          },
          false,
        ],
        // Any body (a ProblemDetails from a bare Unauthorized() or
        // NotFound(), plain text, ...) may come from inside the action.
        [{ reason: 'HTTP', upstreamStatus: 401 }, false],
        [{ reason: 'HTTP', upstreamStatus: 403 }, false],
        [{ reason: 'HTTP', upstreamStatus: 404 }, false],
        // Other statuses are not rescued by an empty body.
        [{ reason: 'HTTP', upstreamStatus: 400, hasEmptyBody: true }, false],
        [{ reason: 'HTTP', upstreamStatus: 409, hasEmptyBody: true }, false],
        [{ reason: 'HTTP', upstreamStatus: 500, hasEmptyBody: true }, false],
        [{ reason: 'TRANSPORT', hasEmptyBody: true }, false],
        // One's own GeneralResponse means its action handler ran, whatever
        // the status: it may already have filed or sent.
        [
          { reason: 'HTTP', upstreamStatus: 401, hasGeneralResponseBody: true },
          false,
        ],
        [
          { reason: 'HTTP', upstreamStatus: 403, hasGeneralResponseBody: true },
          false,
        ],
        [
          { reason: 'HTTP', upstreamStatus: 404, hasGeneralResponseBody: true },
          false,
        ],
        [
          {
            reason: 'HTTP',
            upstreamStatus: 400,
            isValidationProblemBody: true,
          },
          true,
        ],
        // A 400 with no recognisable body (empty, text, HTML, a bare
        // ProblemDetails) may come from inside the action.
        [{ reason: 'HTTP', upstreamStatus: 400 }, false],
        [
          { reason: 'HTTP', upstreamStatus: 400, hasGeneralResponseBody: true },
          false,
        ],
        // ValidationProblemDetails on another status is not model validation.
        [
          {
            reason: 'HTTP',
            upstreamStatus: 409,
            isValidationProblemBody: true,
          },
          false,
        ],
        [{ reason: 'HTTP', upstreamStatus: 409 }, false],
        [{ reason: 'HTTP', upstreamStatus: 429 }, false],
        [{ reason: 'HTTP', upstreamStatus: 500 }, false],
        [{ reason: 'HTTP' }, false],
        [{ reason: 'REJECTED', upstreamStatus: 200, errorNumber: '1' }, false],
        [{ reason: 'TRANSPORT' }, false],
        [{ reason: 'UNEXPECTED_RESPONSE', upstreamStatus: 200 }, false],
      ] as const)('%o is definitive=%s', (details, definitive) => {
        expect(
          isDefinitiveOneSystemsFailure(error({ operation, ...details })),
        ).toBe(definitive)
      })

      it('an allowlisted pre-flight ErrorNumber makes any reason definitive, for that operation only', () => {
        const other =
          operation === 'CreateDocument'
            ? 'SendDocToIslandIs'
            : 'CreateDocument'
        const allowlist = {
          CreateDocument: [],
          SendDocToIslandIs: [],
          [operation]: ['PRE-1'],
        }

        for (const details of [
          { reason: 'REJECTED', upstreamStatus: 200 },
          { reason: 'HTTP', upstreamStatus: 500, hasGeneralResponseBody: true },
          { reason: 'HTTP', upstreamStatus: 400, hasGeneralResponseBody: true },
        ] as const) {
          expect(
            isDefinitiveOneSystemsFailureGiven(
              error({ operation, errorNumber: 'PRE-1', ...details }),
              allowlist,
            ),
          ).toBe(true)
          expect(
            isDefinitiveOneSystemsFailureGiven(
              error({ operation, errorNumber: 'OTHER', ...details }),
              allowlist,
            ),
          ).toBe(false)
          expect(
            isDefinitiveOneSystemsFailureGiven(
              error({ operation: other, errorNumber: 'PRE-1', ...details }),
              allowlist,
            ),
          ).toBe(false)
        }
      })
    },
  )

  it('ships with an empty pre-flight allowlist until OneSystems confirms one', () => {
    expect(ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS).toEqual({
      CreateDocument: [],
      SendDocToIslandIs: [],
    })
    expect(Object.isFrozen(ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS)).toBe(true)
    expect(
      Object.isFrozen(ONESYSTEMS_PREFLIGHT_ERROR_NUMBERS.SendDocToIslandIs),
    ).toBe(true)
  })
})

describe('toLoggableErrorNumber', () => {
  it.each([
    '17',
    '42',
    'E-42',
    'ERR_123',
    'ERR_NOT_FOUND',
    'v1.2',
    '12345678',
    '12-3456',
    // Eight digits in total, one short of the kennitala rule.
    'E-12345678',
  ])('logs the code-shaped %p as it is', (value) => {
    expect(toLoggableErrorNumber(value)).toBe(value)
  })

  it.each([
    // A kennitala, bare and hyphenated (the fake 010130 test prefix).
    '0101302989',
    '010130-2989',
    // ... or one inside an otherwise code-shaped value.
    'E0101302989',
    '0101302989_1',
    '010130-2989x',
    'ERR-010130-2989',
    '0101302989.1',
    // Nine or more digits anywhere (a stringified numeric ErrorNumber too).
    '123456789',
    'E123456789',
    '1234567890123',
    // Nine digits in total, whatever separates or prefixes them.
    '010130.2989',
    '010130_2989',
    '010130--2989',
    '0101-30-2989',
    '01.01.30-2989',
    '10130-2989',
    '1.0.1.3.0.2.9.8.9',
    // Free text that may echo input.
    'Viðtakandi fannst ekki',
    'a b',
    'x'.repeat(33),
    '',
  ])('withholds %p', (value) => {
    expect(toLoggableErrorNumber(value)).toBe(WITHHELD_ERROR_NUMBER)
  })

  it.each([null, undefined])('is undefined for %p', (value) => {
    expect(toLoggableErrorNumber(value)).toBeUndefined()
  })
})

describe('OneSystemsError serialisation', () => {
  /** The fake 010130 test kennitala, bare and hyphenated. */
  const KENNITALA = '0101302989'
  const KENNITALA_HYPHENATED = '010130-2989'
  const NAME = 'Jón Jónsson'
  const ECHO = `Viðtakandi ${KENNITALA} (${NAME}) fannst ekki`

  const serialisations = (e: OneSystemsError) => ({
    'JSON.stringify(error)': JSON.stringify(e),
    'JSON.stringify({ exception: error })': JSON.stringify({ exception: e }),
    'util.inspect(error)': inspect(e, { depth: 10 }),
    'util.inspect({ exception: error })': inspect({ exception: e }),
    'getResponse()': JSON.stringify(e.getResponse()),
    message: e.message,
    'object spread': JSON.stringify({ ...e }),
    'util.inspect(object spread)': inspect({ ...e }, { depth: 10 }),
    'util.inspect(object spread, showHidden)': inspect(
      { ...e },
      { depth: 10, showHidden: true },
    ),
  })

  const leaky = (errorNumber: string) =>
    new OneSystemsError('OneSystems SendDocToIslandIs was rejected', {
      operation: 'SendDocToIslandIs',
      reason: 'REJECTED',
      upstreamStatus: 200,
      errorNumber,
      errorMessage: ECHO,
      cause: new SyntaxError(`Unexpected token in "${ECHO}"`),
    })

  it.each([KENNITALA, KENNITALA_HYPHENATED, ECHO])(
    'no serialisation carries the raw ErrorNumber %p or One’s ErrorMessage',
    (errorNumber) => {
      const e = leaky(errorNumber)

      for (const [how, text] of Object.entries(serialisations(e))) {
        for (const pii of [KENNITALA, KENNITALA_HYPHENATED, NAME, ECHO]) {
          expect({ how, leaked: text.includes(pii) }).toEqual({
            how,
            leaked: false,
          })
        }
      }
    },
  )

  it('an object spread carries no raw ErrorNumber, ErrorMessage or cause', () => {
    const e = leaky(KENNITALA)
    const spread: Record<string, unknown> = { ...e }

    expect(spread).not.toHaveProperty('cause')
    expect(spread).not.toHaveProperty('options')
    expect(spread).not.toHaveProperty('errorNumber')
    expect(spread).not.toHaveProperty('errorMessage')
    const text = inspect(spread, { depth: 10 })
    expect(text).not.toContain(KENNITALA)
    expect(text).not.toContain(ECHO)
    expect(text).not.toContain('Unexpected token')
    // The safe fields are still there.
    expect(spread).toMatchObject({ operation: 'SendDocToIslandIs' })
  })

  it('keeps the cause readable, but not enumerable', () => {
    const cause = new SyntaxError('x')
    const e = new OneSystemsError('m', {
      operation: 'CreateCase',
      reason: 'TRANSPORT',
      cause,
    })

    expect(e.cause).toBe(cause)
    expect(Object.keys(e)).not.toContain('cause')
    expect(Object.keys(e)).not.toContain('options')
    expect(
      new OneSystemsError('m', { operation: 'CreateCase', reason: 'TRANSPORT' })
        .cause,
    ).toBeUndefined()
  })

  it('keeps the raw values readable as properties, but not enumerable or writable', () => {
    const e = leaky(KENNITALA)

    expect(e.errorNumber).toBe(KENNITALA)
    expect(e.errorMessage).toBe(ECHO)
    expect(Object.keys(e)).not.toContain('errorNumber')
    expect(Object.keys(e)).not.toContain('errorMessage')
    expect(() => {
      ;(e as { errorMessage: string | null }).errorMessage = 'x'
    }).toThrow(TypeError)
    expect(e.errorMessage).toBe(ECHO)
  })

  it('toJSON returns only the safe fields, with a code-shaped ErrorNumber passed through', () => {
    const e = new OneSystemsError(
      'OneSystems CreateDocument failed with HTTP 403',
      {
        operation: 'CreateDocument',
        reason: 'HTTP',
        upstreamStatus: 403,
        hasEmptyBody: true,
        errorNumber: 'E-17',
        errorMessage: ECHO,
      },
    )

    expect(e.toJSON()).toEqual({
      name: 'OneSystemsError',
      message: 'OneSystems CreateDocument failed with HTTP 403',
      operation: 'CreateDocument',
      reason: 'HTTP',
      upstreamStatus: 403,
      hasGeneralResponseBody: false,
      isValidationProblemBody: false,
      hasEmptyBody: true,
      hasBearerChallenge: false,
      errorNumber: 'E-17',
    })
    expect(leaky(KENNITALA).toJSON().errorNumber).toBe(WITHHELD_ERROR_NUMBER)
  })

  it('util.inspect keeps the stack, the safe fields and the cause’s name', () => {
    const text = inspect(leaky(KENNITALA))

    expect(text).toContain('OneSystems SendDocToIslandIs was rejected')
    expect(text).toContain('onesystems.errors.spec')
    expect(text).toContain("reason: 'REJECTED'")
    expect(text).toContain("causeName: 'SyntaxError'")
    expect(text).toContain(WITHHELD_ERROR_NUMBER)
  })

  it('is still a 502 HttpException whose response body is our message', () => {
    const e = leaky(KENNITALA)

    expect(e.getStatus()).toBe(502)
    // Nest builds the body from our message alone: statusCode, message and an
    // `error` description, which is undefined when options are passed.
    expect(e.getResponse()).toEqual({
      statusCode: 502,
      message: 'OneSystems SendDocToIslandIs was rejected',
      error: undefined,
    })
  })
})
