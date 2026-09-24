import { inspect } from 'node:util'

import {
  isDefinitiveOneSystemsFailure,
  OneSystemsError,
} from './onesystems.errors'
import { OneSystemsService } from './onesystems.service'

const BASE_URL = 'https://one.test/OneExternalAPI'
const USERNAME = 'dmr-integration-user'
const PASSWORD = 'pa55-w0rd-that-must-never-be-logged'
const TOKEN_1 = 'token-one-that-must-never-be-logged'
const TOKEN_2 = 'token-two-that-must-never-be-logged'
const NATIONAL_ID = '1234567890'
const PDF = Buffer.from('%PDF-1.7 notice body')

/**
 * Company-shaped (day 55, so the logger's `maskNationalId` would not mask it)
 * and all one digit, so it is nobody's real kennitala and passes
 * `disallow-kennitalas`. The service must never hand it to the logger in the
 * first place.
 */
const COMPANY_NATIONAL_ID = '5555555555'
const COMPANY_NATIONAL_ID_HYPHENATED = '555555-5555'
const CUSTOMER_NAME = 'Leyndarmál Fyrirtækis ehf.'
const SUBJECT = 'Áminning um jafnlaunavottun'

const ENV_KEYS = [
  'ONESYSTEMS_API_URL',
  'ONESYSTEMS_USERNAME',
  'ONESYSTEMS_PASSWORD',
] as const

const LOGIN_PATH = '/OneExternalAPI/api/auth/Login'

type Reply = () => Response | Promise<Response>

const json = (
  body: unknown,
  init: { status?: number; contentType?: string | null } = {},
): Response => {
  const headers = new Headers()
  if (init.contentType !== null) {
    headers.set('Content-Type', init.contentType ?? 'application/json')
  }
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  })
}

const success = (extra: Record<string, unknown> = {}) =>
  json({ Success: true, ItemID: 'item-1', ErrorMessage: null, ...extra })

/** ASP.NET's model-validation body: rejected before the action ran. */
const problemDetails = (status = 400) =>
  json(
    {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status,
      errors: { IDNumber: ['The IDNumber field is required.'] },
    },
    { status, contentType: 'application/problem+json' },
  )

/**
 * ASP.NET's JwtBearer challenge: an empty 401 with a Bearer
 * `WWW-Authenticate`. Written before any action runs.
 */
const bearerChallenge = (
  header = 'Bearer error="invalid_token", error_description="The token expired"',
) =>
  new Response(null, { status: 401, headers: { 'WWW-Authenticate': header } })

/** A server with several auth handlers lists each scheme's challenge. */
const LATER_BEARER = 'Negotiate, Bearer error="invalid_token"'

/** An empty 401 with no challenge: an in-action `Unauthorized(null)`. */
const bareEmpty401 = () => new Response(null, { status: 401 })

/**
 * A non-2xx whose body starts arriving and then fails mid-stream (a reset
 * connection). Its first chunk echoes the input, which must never be logged.
 */
const unreadableBody = (status: number, readError: Error) => {
  let pulls = 0
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1
        if (pulls === 1) {
          controller.enqueue(
            new TextEncoder().encode(`{"errors":{"IDNumber":["${NATIONAL_ID}`),
          )
        } else {
          controller.error(readError)
        }
      },
    }),
    { status },
  )
}

/** One's own body on a non-2xx: the action handler ran. */
const generalResponse = (status: number, errorNumber = '17') =>
  json(
    { Success: false, ErrorNumber: errorNumber, ErrorMessage: 'Villa' },
    { status },
  )

describe('OneSystemsService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const originalEnv = Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]]),
  )
  const originalFetch = global.fetch

  let service: OneSystemsService
  let fetchMock: jest.Mock<Promise<Response>, [Request]>
  let loginReplies: Array<Reply>
  let actionReplies: Array<Reply>

  const requests = () => fetchMock.mock.calls.map(([request]) => request)
  const loginRequests = () =>
    requests().filter((r) => new URL(r.url).pathname === LOGIN_PATH)
  const actionRequests = () =>
    requests().filter((r) => new URL(r.url).pathname !== LOGIN_PATH)
  const bodyOf = (request: Request) => request.clone().json()

  const loggedText = () =>
    JSON.stringify(
      [logger.debug, logger.info, logger.warn, logger.error].flatMap(
        (fn) => fn.mock.calls,
      ),
    )

  const createCase = () =>
    service.createCase({
      nationalId: NATIONAL_ID,
      customerName: 'Fyrirtæki ehf.',
      caseType: 'JAFN-OVERDUE',
    })
  const createDocument = () =>
    service.createDocument({ caseItemId: 'case-1', subject: 's', file: PDF })
  const sendDocToIslandIs = () =>
    service.sendDocToIslandIs({
      documentItemId: 'doc-1',
      nationalId: NATIONAL_ID,
    })
  const closeCase = () => service.closeCase({ caseId: 'case-1' })

  const caught = async (promise: Promise<unknown>): Promise<unknown> => {
    try {
      await promise
    } catch (error) {
      return error
    }
    throw new Error('Expected the call to throw')
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()

    process.env.ONESYSTEMS_API_URL = BASE_URL
    process.env.ONESYSTEMS_USERNAME = USERNAME
    process.env.ONESYSTEMS_PASSWORD = PASSWORD

    loginReplies = [() => json({ token: TOKEN_1 })]
    actionReplies = []

    fetchMock = jest.fn(async (request: Request) => {
      const queue =
        new URL(request.url).pathname === LOGIN_PATH
          ? loginReplies
          : actionReplies
      const reply = queue.length > 1 ? queue.shift() : queue[0]
      if (!reply) {
        throw new Error(`No reply queued for ${request.url}`)
      }
      return reply()
    })
    global.fetch = fetchMock as unknown as typeof fetch

    service = new OneSystemsService(logger as never)
  })

  afterAll(() => {
    // Key by key: reassigning `process.env` replaces Node's special object and
    // loses its string coercion for every later test in the worker.
    for (const key of ENV_KEYS) {
      const value = originalEnv[key]
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    global.fetch = originalFetch
  })

  describe('Login and the bearer token', () => {
    it('logs in on ONESYSTEMS_API_URL without a bearer token, then calls the action with one', async () => {
      actionReplies = [
        () => success({ ItemID: 'case-1', CaseNumber: '2026-9' }),
      ]

      await expect(createCase()).resolves.toEqual({
        caseItemId: 'case-1',
        caseNumber: '2026-9',
      })

      const [login, action] = requests()
      expect(login.url).toBe(`${BASE_URL}/api/auth/Login`)
      expect(login.method).toBe('POST')
      expect(login.headers.get('Authorization')).toBeNull()
      await expect(bodyOf(login)).resolves.toEqual({
        UserName: USERNAME,
        Password: PASSWORD,
      })

      expect(action.url).toBe(`${BASE_URL}/api/actions/CreateCase`)
      expect(action.headers.get('Authorization')).toBe(`Bearer ${TOKEN_1}`)
    })

    it('reads ONESYSTEMS_API_URL at call time and tolerates a trailing slash', async () => {
      process.env.ONESYSTEMS_API_URL = 'https://other.test/OneExternalAPI/'
      actionReplies = [() => success()]

      await createCase()

      expect(requests().map((r) => r.url)).toEqual([
        'https://other.test/OneExternalAPI/api/auth/Login',
        'https://other.test/OneExternalAPI/api/actions/CreateCase',
      ])
    })

    it('reuses a valid token across calls', async () => {
      actionReplies = [() => success()]

      await createCase()
      await createCase()

      expect(loginRequests()).toHaveLength(1)
      expect(actionRequests()).toHaveLength(2)
    })

    it('shares one Login between concurrent calls', async () => {
      let releaseLogin: () => void = () => undefined
      loginReplies = [
        () =>
          new Promise<Response>((resolve) => {
            releaseLogin = () => resolve(json({ token: TOKEN_1 }))
          }),
      ]
      actionReplies = [() => success()]

      const calls = Promise.all([createCase(), createCase(), createCase()])
      // Let every caller reach the token cache before Login answers.
      await new Promise((resolve) => setImmediate(resolve))
      releaseLogin()
      await calls

      expect(loginRequests()).toHaveLength(1)
      expect(actionRequests()).toHaveLength(3)
      expect(
        actionRequests().map((r) => r.headers.get('Authorization')),
      ).toEqual(Array(3).fill(`Bearer ${TOKEN_1}`))
    })

    it('on a 401 drops the token, logs in again and retries the action once', async () => {
      loginReplies = [
        () => json({ token: TOKEN_1 }),
        () => json({ token: TOKEN_2 }),
      ]
      actionReplies = [
        () => new Response(null, { status: 401 }),
        () => success({ ItemID: 'case-2' }),
      ]

      await expect(createCase()).resolves.toMatchObject({
        caseItemId: 'case-2',
      })

      expect(loginRequests()).toHaveLength(2)
      expect(
        actionRequests().map((r) => r.headers.get('Authorization')),
      ).toEqual([`Bearer ${TOKEN_1}`, `Bearer ${TOKEN_2}`])
    })

    it.each([
      ['createCase', () => createCase()],
      ['closeCase', () => closeCase()],
    ])(
      '%s still retries a 401 with a One GeneralResponse (safe to repeat)',
      async (_name, call) => {
        loginReplies = [
          () => json({ token: TOKEN_1 }),
          () => json({ token: TOKEN_2 }),
        ]
        actionReplies = [() => generalResponse(401), () => success()]

        await expect(call()).resolves.toBeDefined()

        expect(loginRequests()).toHaveLength(2)
        expect(actionRequests()).toHaveLength(2)
      },
    )

    it('retries only once: a second 401 is thrown as a definitive HTTP failure', async () => {
      loginReplies = [
        () => json({ token: TOKEN_1 }),
        () => json({ token: TOKEN_2 }),
      ]
      actionReplies = [() => new Response(null, { status: 401 })]

      const error = await caught(createCase())

      expect(error).toBeInstanceOf(OneSystemsError)
      expect(error).toMatchObject({
        operation: 'CreateCase',
        reason: 'HTTP',
        upstreamStatus: 401,
      })
      expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
      expect(loginRequests()).toHaveLength(2)
      expect(actionRequests()).toHaveLength(2)
    })

    it('gives every request, including Login and the retry, its own 30s timeout', async () => {
      const timeout = jest.spyOn(AbortSignal, 'timeout')
      loginReplies = [
        () => json({ token: TOKEN_1 }),
        () => json({ token: TOKEN_2 }),
      ]
      actionReplies = [
        () => new Response(null, { status: 401 }),
        () => success(),
      ]

      await createCase()

      expect(timeout.mock.calls).toEqual([
        [30_000],
        [30_000],
        [30_000],
        [30_000],
      ])
      expect(requests()).toHaveLength(4)
      for (const request of requests()) {
        expect(request.signal).toBeDefined()
      }
    })

    it.each([
      ['createDocument', () => createDocument()],
      ['sendDocToIslandIs', () => sendDocToIslandIs()],
    ])(
      'gives %s a 120s timeout, and its Login and retry Login 30s',
      async (_name, call) => {
        const timeout = jest.spyOn(AbortSignal, 'timeout')
        loginReplies = [
          () => json({ token: TOKEN_1 }),
          () => json({ token: TOKEN_2 }),
        ]
        actionReplies = [() => bearerChallenge(), () => success()]

        await call()

        expect(timeout.mock.calls).toEqual([
          [30_000],
          [120_000],
          [30_000],
          [120_000],
        ])
      },
    )

    it.each([
      ['an HTTP error', () => new Response('nope', { status: 500 }), 'HTTP'],
      [
        'a body with no token',
        () => json({ jwt: 'not-a-recognised-key' }),
        'UNEXPECTED_RESPONSE',
      ],
      [
        'a transport failure',
        () => Promise.reject(new TypeError('fetch failed')),
        'TRANSPORT',
      ],
    ] as const)(
      'a Login that fails with %s never sends the action and is definitive',
      async (_label, reply, reason) => {
        loginReplies = [reply]
        actionReplies = [() => success()]

        const error = await caught(sendDocToIslandIs())

        expect(error).toMatchObject({ operation: 'Login', reason })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        expect(actionRequests()).toHaveLength(0)
      },
    )

    it('wraps anything else thrown inside Login as a definitive Login failure', async () => {
      const cause = new RangeError(
        `something unexpected ${COMPANY_NATIONAL_ID}`,
      )
      jest.spyOn(AbortSignal, 'timeout').mockImplementationOnce(() => {
        throw cause
      })
      actionReplies = [() => success()]

      const error = await caught(sendDocToIslandIs())

      expect(error).toBeInstanceOf(OneSystemsError)
      expect(error).toMatchObject({ operation: 'Login' })
      expect((error as { cause?: unknown }).cause).toBe(cause)
      expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(loggedText()).not.toContain('something unexpected')
      expect(loggedText()).not.toContain(COMPANY_NATIONAL_ID)
    })
  })

  describe('configuration', () => {
    const allActions = [
      ['createCase', 'CreateCase', createCase],
      ['createDocument', 'CreateDocument', createDocument],
      ['sendDocToIslandIs', 'SendDocToIslandIs', sendDocToIslandIs],
      ['closeCase', 'CloseCase', closeCase],
    ] as const

    it.each(allActions)(
      '%s: an unset ONESYSTEMS_API_URL is a definitive CONFIG failure, with no request and no default URL',
      async (_name, operation, call) => {
        delete process.env.ONESYSTEMS_API_URL

        const error = await caught(call())

        expect(error).toBeInstanceOf(OneSystemsError)
        expect(error).toMatchObject({ operation, reason: 'CONFIG' })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        expect(fetchMock).not.toHaveBeenCalled()
      },
    )

    it('a blank ONESYSTEMS_API_URL counts as unset', async () => {
      process.env.ONESYSTEMS_API_URL = '   '

      const error = await caught(createDocument())

      expect(error).toMatchObject({ reason: 'CONFIG' })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it.each(['ONESYSTEMS_USERNAME', 'ONESYSTEMS_PASSWORD'])(
      'a missing %s is a definitive CONFIG failure of Login, before any request',
      async (name) => {
        delete process.env[name]

        const error = await caught(sendDocToIslandIs())

        expect(error).toBeInstanceOf(OneSystemsError)
        expect(error).toMatchObject({ operation: 'Login', reason: 'CONFIG' })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        expect(fetchMock).not.toHaveBeenCalled()
      },
    )
  })

  describe('input validation', () => {
    it.each([
      [
        'createDocument with an invalid createDate',
        'CreateDocument',
        () =>
          service.createDocument({
            caseItemId: 'case-1',
            subject: 's',
            file: PDF,
            createDate: new Date('not a date'),
          }),
      ],
      [
        'createDocument with an empty file',
        'CreateDocument',
        () =>
          service.createDocument({
            caseItemId: 'case-1',
            subject: 's',
            file: Buffer.alloc(0),
          }),
      ],
      [
        'createDocument with an empty caseItemId',
        'CreateDocument',
        () =>
          service.createDocument({ caseItemId: '', subject: 's', file: PDF }),
      ],
      [
        'createDocument with a blank subject',
        'CreateDocument',
        () =>
          service.createDocument({
            caseItemId: 'case-1',
            subject: '  ',
            file: PDF,
          }),
      ],
      [
        'sendDocToIslandIs with an empty documentItemId',
        'SendDocToIslandIs',
        () =>
          service.sendDocToIslandIs({
            documentItemId: '',
            nationalId: NATIONAL_ID,
          }),
      ],
      [
        'sendDocToIslandIs with an empty nationalId',
        'SendDocToIslandIs',
        () =>
          service.sendDocToIslandIs({
            documentItemId: 'doc-1',
            nationalId: '',
          }),
      ],
      [
        'createCase with an empty caseType',
        'CreateCase',
        () =>
          service.createCase({
            nationalId: NATIONAL_ID,
            customerName: 'n',
            caseType: '',
          }),
      ],
      [
        'closeCase with an empty caseId',
        'CloseCase',
        () => service.closeCase({ caseId: '' }),
      ],
    ] as const)(
      '%s is a definitive INVALID_INPUT failure before any request, even Login',
      async (_label, operation, call) => {
        actionReplies = [() => success()]

        const error = await caught(call())

        expect(error).toBeInstanceOf(OneSystemsError)
        expect(error).toMatchObject({ operation, reason: 'INVALID_INPUT' })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        expect(fetchMock).not.toHaveBeenCalled()
      },
    )
  })

  describe('request bodies', () => {
    beforeEach(() => {
      actionReplies = [() => success()]
    })

    it('createCase maps the input onto CreateCaseModel', async () => {
      await service.createCase({
        nationalId: NATIONAL_ID,
        customerName: 'Fyrirtæki ehf.',
        caseType: 'JAFN-OVERDUE',
        portal: true,
      })

      await expect(bodyOf(actionRequests()[0])).resolves.toEqual({
        IDNumber: NATIONAL_ID,
        CustomerName: 'Fyrirtæki ehf.',
        CaseType: 'JAFN-OVERDUE',
        Portal: true,
      })
    })

    it('createDocument sends the file base64-encoded with PDF as the default extension', async () => {
      await expect(
        service.createDocument({
          caseItemId: 'case-1',
          subject: 'Áminning',
          file: PDF,
          createDate: new Date('2026-09-24T10:00:00.000Z'),
          author: 'Jafnréttisstofa',
          docCategory: 'cat',
          docType: 'type',
        }),
      ).resolves.toEqual({ documentItemId: 'item-1' })

      const request = actionRequests()[0]
      expect(new URL(request.url).pathname).toBe(
        '/OneExternalAPI/api/actions/CreateDocument',
      )
      await expect(bodyOf(request)).resolves.toEqual({
        ParentID: 'case-1',
        Subject: 'Áminning',
        Extension: 'PDF',
        CreateDate: '2026-09-24T10:00:00.000Z',
        Author: 'Jafnréttisstofa',
        DocCategory: 'cat',
        DocType: 'type',
        File: PDF.toString('base64'),
      })
    })

    it('sendDocToIslandIs maps the input and returns the island.is document id', async () => {
      actionReplies = [() => success({ ItemID: 'island-doc-1' })]

      await expect(
        service.sendDocToIslandIs({
          documentItemId: 'doc-1',
          nationalId: NATIONAL_ID,
          category: 'c',
          type: 't',
          sendNotification: true,
        }),
      ).resolves.toEqual({ islandIsDocumentId: 'island-doc-1' })

      await expect(bodyOf(actionRequests()[0])).resolves.toEqual({
        ItemID: 'doc-1',
        IDNumber: NATIONAL_ID,
        Category: 'c',
        Type: 't',
        SendNotification: true,
      })
    })

    it('closeCase defaults the status to Lokið', async () => {
      await expect(service.closeCase({ caseId: '2026-9' })).resolves.toEqual({
        caseItemId: 'item-1',
      })

      await expect(bodyOf(actionRequests()[0])).resolves.toEqual({
        CaseID: '2026-9',
        StatusName: 'Lokið',
      })
    })
  })

  describe('response handling', () => {
    const idempotentActions = [
      ['createCase', createCase],
      ['closeCase', closeCase],
    ] as const
    const nonIdempotentActions = [
      ['createDocument', createDocument],
      ['sendDocToIslandIs', sendDocToIslandIs],
    ] as const
    const actions = [...idempotentActions, ...nonIdempotentActions]

    const rejected = () =>
      json({
        Success: false,
        ErrorNumber: '42',
        ErrorMessage: 'Málasniðmát fannst ekki',
        ItemID: null,
      })

    it.each(idempotentActions)(
      '%s: a 200 with Success:false is a definitive REJECTED failure carrying One’s error',
      async (_name, call) => {
        actionReplies = [rejected]

        const error = await caught(call())

        expect(error).toBeInstanceOf(OneSystemsError)
        expect(error).toMatchObject({
          reason: 'REJECTED',
          upstreamStatus: 200,
          errorNumber: '42',
          errorMessage: 'Málasniðmát fannst ekki',
        })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        // One's own message is kept off the exception message.
        expect((error as Error).message).not.toContain('Málasniðmát')
      },
    )

    it.each(nonIdempotentActions)(
      '%s: a 200 with Success:false is REJECTED but NOT definitive (One may have filed or sent it)',
      async (_name, call) => {
        actionReplies = [rejected]

        const error = await caught(call())

        expect(error).toMatchObject({
          reason: 'REJECTED',
          errorNumber: '42',
          errorMessage: 'Málasniðmát fannst ekki',
        })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
      },
    )

    it.each([
      ['createCase', createCase],
      ['createDocument', createDocument],
      ['closeCase', closeCase],
    ] as const)(
      '%s: Success:true without an ItemID is an unclear failure',
      async (_name, call) => {
        actionReplies = [() => json({ Success: true, ItemID: '' })]

        const error = await caught(call())

        expect(error).toMatchObject({
          reason: 'UNEXPECTED_RESPONSE',
          upstreamStatus: 200,
        })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
      },
    )

    it.each([
      ['an empty ItemID', { Success: true, ItemID: '' }],
      ['a null ItemID', { Success: true, ItemID: null }],
      ['no ItemID', { Success: true, ResultText: 'Sent' }],
    ])(
      'sendDocToIslandIs: Success:true with %s is sent, with a null id and a warning',
      async (_label, body) => {
        actionReplies = [() => json(body)]

        await expect(sendDocToIslandIs()).resolves.toEqual({
          islandIsDocumentId: null,
        })
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('without an ItemID'),
          expect.objectContaining({ operation: 'SendDocToIslandIs' }),
        )
      },
    )

    it.each(actions)(
      '%s: a fetch rejection is an unclear TRANSPORT failure',
      async (_name, call) => {
        const cause = new TypeError('fetch failed')
        actionReplies = [() => Promise.reject(cause)]

        const error = await caught(call())

        expect(error).toBeInstanceOf(OneSystemsError)
        expect(error).toMatchObject({ reason: 'TRANSPORT' })
        expect((error as OneSystemsError).upstreamStatus).toBeUndefined()
        expect((error as { cause?: unknown }).cause).toBe(cause)
        expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
      },
    )

    it.each<[string, string, string | undefined]>([
      ['ECONNREFUSED', 'ECONNREFUSED', 'ECONNREFUSED'],
      ['UND_ERR_SOCKET', 'UND_ERR_SOCKET', 'UND_ERR_SOCKET'],
      // Longer than One's ErrorNumber filter allows (33 characters).
      [
        'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
        'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
        'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
      ],
      ['a 64-character code', 'E'.repeat(64), 'E'.repeat(64)],
      ['a lower-case code', 'econnrefused', undefined],
      ['a code with a hyphen', 'E-CONN', undefined],
      ['a code over 64 characters', 'E'.repeat(65), undefined],
      ['a kennitala-shaped code', `E${NATIONAL_ID}`, undefined],
    ])(
      'logs the transport error code %s as %p',
      async (_label, code, logged) => {
        actionReplies = [
          () =>
            Promise.reject(
              new TypeError('fetch failed', {
                cause: Object.assign(new Error('x'), { code }),
              }),
            ),
        ]

        await caught(createCase())

        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('no usable response'),
          expect.objectContaining({
            errorName: 'TypeError',
            errorCode: logged,
          }),
        )
      },
    )

    it.each([
      [42, '42', '42'],
      [123456789, '123456789', '[not a code, withheld]'],
      [101302989, '101302989', '[not a code, withheld]'],
    ])(
      'keeps a numeric ErrorNumber %p as %p and logs it through the filter as %p',
      async (number, raw, logged) => {
        actionReplies = [() => json({ Success: false, ErrorNumber: number })]

        const error = await caught(createCase())

        expect(error).toMatchObject({ reason: 'REJECTED', errorNumber: raw })
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('was rejected'),
          expect.objectContaining({ errorNumber: logged }),
        )
        if (raw !== logged) {
          expect(loggedText()).not.toContain(raw)
          expect((error as Error).message).not.toContain(raw)
        }
      },
    )

    it('a timeout is an unclear TRANSPORT failure', async () => {
      actionReplies = [
        () =>
          Promise.reject(
            new DOMException('The operation was aborted', 'TimeoutError'),
          ),
      ]

      const error = await caught(createCase())

      expect(error).toMatchObject({
        operation: 'CreateCase',
        reason: 'TRANSPORT',
      })
      expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
    })

    it.each([
      [400, true],
      [404, true],
      [429, true],
      [500, false],
      [502, false],
      [504, false],
    ])(
      'createCase: HTTP %i is an HTTP failure, definitive=%s',
      async (status, definitive) => {
        actionReplies = [() => json({ title: 'error' }, { status })]

        const error = await caught(createCase())

        expect(error).toMatchObject({ reason: 'HTTP', upstreamStatus: status })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(definitive)
      },
    )

    describe.each(idempotentActions)('%s over HTTP', (_name, call) => {
      it.each<{ label: string; reply: Reply }>([
        {
          label: '403 with no body',
          reply: () => new Response(null, { status: 403 }),
        },
        {
          label: '404 with no body',
          reply: () => new Response('', { status: 404 }),
        },
        {
          label: '403 with a whitespace-only body',
          reply: () => new Response(' \n', { status: 403 }),
        },
      ])('$label is still definitive', async ({ reply }) => {
        actionReplies = [reply]

        const error = await caught(call())

        expect(error).toMatchObject({ reason: 'HTTP', hasEmptyBody: true })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
      })

      it('retries an empty 401 without a Bearer challenge once, too', async () => {
        loginReplies = [
          () => json({ token: TOKEN_1 }),
          () => json({ token: TOKEN_2 }),
        ]
        actionReplies = [bareEmpty401, () => success()]

        await expect(call()).resolves.toBeDefined()

        expect(loginRequests()).toHaveLength(2)
        expect(actionRequests()).toHaveLength(2)
      })
    })

    describe.each(actions)(
      '%s: a non-2xx whose body fails mid-stream',
      (_name, call) => {
        it.each([400, 403, 404, 500])(
          'HTTP %i is an unclear TRANSPORT failure carrying the read error',
          async (status) => {
            const readError = new TypeError('terminated')
            actionReplies = [() => unreadableBody(status, readError)]

            const error = await caught(call())

            expect(error).toBeInstanceOf(OneSystemsError)
            expect(error).toMatchObject({
              reason: 'TRANSPORT',
              upstreamStatus: status,
              hasEmptyBody: false,
            })
            expect((error as { cause?: unknown }).cause).toBe(readError)
            expect(isDefinitiveOneSystemsFailure(error)).toBe(false)

            const [, meta] = logger.error.mock.calls.find(([message]) =>
              String(message).includes('no usable response'),
            ) ?? [undefined, undefined]
            expect(meta).toMatchObject({ status, errorName: 'TypeError' })
            expect(meta).not.toHaveProperty('bodyLength')
            expect(loggedText()).not.toContain(NATIONAL_ID)
            expect(loggedText()).not.toContain('bodyLength')
          },
        )
      },
    )

    describe.each(nonIdempotentActions)('%s over HTTP', (_name, call) => {
      /**
       * A bare `Unauthorized()` / `NotFound()` from an action, or a
       * `Problem(statusCode: 403)`. (`Forbid()` is an empty 403 instead.)
       */
      const bareProblemDetails = (status: number) =>
        json(
          {
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.2',
            title: 'Unauthorized',
            status,
            traceId: '00-abc-def-00',
          },
          { status, contentType: 'application/problem+json' },
        )

      it.each<{ label: string; reply: Reply; definitive: boolean }>([
        {
          label: '400 ValidationProblemDetails (model validation)',
          reply: problemDetails,
          definitive: true,
        },
        {
          label: '400 with an empty body',
          reply: () => new Response('', { status: 400 }),
          definitive: false,
        },
        {
          label:
            '400 with a plain-text body (a BadRequest("...") from the action)',
          reply: () =>
            new Response('island.is failed', {
              status: 400,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            }),
          definitive: false,
        },
        {
          label:
            '400 ProblemDetails without errors (a bare BadRequest() from the action)',
          reply: () => bareProblemDetails(400),
          definitive: false,
        },
        {
          label: '400 HTML',
          reply: () =>
            new Response('<html><body>Bad Request</body></html>', {
              status: 400,
              headers: { 'Content-Type': 'text/html' },
            }),
          definitive: false,
        },
        {
          label: '400 with a One GeneralResponse',
          reply: () => generalResponse(400),
          definitive: false,
        },
        // An empty 403 or 404 can come from inside the action too:
        // Forbid() goes through the auth handler, NotFound(null) keeps 404.
        {
          label: '403 with no body (Forbid() from the action)',
          reply: () => new Response(null, { status: 403 }),
          definitive: false,
        },
        {
          label: '403 with a whitespace-only body',
          reply: () => new Response(' \r\n\t ', { status: 403 }),
          definitive: false,
        },
        {
          label: '403 with no body and a Bearer challenge header',
          reply: () =>
            new Response(null, {
              status: 403,
              headers: { 'WWW-Authenticate': 'Bearer' },
            }),
          definitive: false,
        },
        {
          label: '404 with an empty body (NotFound(null) from the action)',
          reply: () => new Response('', { status: 404 }),
          definitive: false,
        },
        {
          label: '404 with a whitespace-only body',
          reply: () => new Response('\n', { status: 404 }),
          definitive: false,
        },
        // Any body means the action may have run and may have acted.
        // A JSON "" parses to an empty string, but the raw body is not empty.
        {
          label: '403 with a JSON "" body',
          reply: () => json('', { status: 403 }),
          definitive: false,
        },
        {
          label: '404 with a JSON "" body',
          reply: () => json('', { status: 404 }),
          definitive: false,
        },
        {
          label: '404 with a JSON "   " body',
          reply: () => json('   ', { status: 404 }),
          definitive: false,
        },
        {
          label:
            '403 ProblemDetails (Problem(statusCode: 403) from the action)',
          reply: () => bareProblemDetails(403),
          definitive: false,
        },
        {
          label: '404 ProblemDetails (a bare NotFound() from the action)',
          reply: () => bareProblemDetails(404),
          definitive: false,
        },
        {
          label: '404 with a plain-text body',
          reply: () => new Response('Not Found', { status: 404 }),
          definitive: false,
        },
        {
          label: '403 with a literal {} body',
          reply: () => new Response('{}', { status: 403 }),
          definitive: false,
        },
        {
          label: '403 with a One GeneralResponse',
          reply: () => generalResponse(403),
          definitive: false,
        },
        {
          label: '404 with a One GeneralResponse',
          reply: () => generalResponse(404),
          definitive: false,
        },
        {
          label: '409',
          reply: () => json({ title: 'conflict' }, { status: 409 }),
          definitive: false,
        },
        {
          label: '429',
          reply: () => new Response(null, { status: 429 }),
          definitive: false,
        },
        {
          label: '500',
          reply: () => new Response('boom', { status: 500 }),
          definitive: false,
        },
        {
          label: '500 with a One GeneralResponse',
          reply: () => generalResponse(500),
          definitive: false,
        },
      ])('$label: definitive=$definitive', async ({ reply, definitive }) => {
        actionReplies = [reply]

        const error = await caught(call())

        expect(error).toMatchObject({ reason: 'HTTP' })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(definitive)
      })

      it.each<{
        label: string
        body: string | null
        contentType?: string
        empty: boolean
      }>([
        { label: 'no body', body: null, empty: true },
        { label: 'an empty body', body: '', empty: true },
        { label: 'a whitespace-only body', body: ' \r\n\t ', empty: true },
        {
          label: 'an empty application/json body',
          body: '',
          contentType: 'application/json',
          empty: true,
        },
        { label: 'a literal {} body', body: '{}', empty: false },
        { label: 'a JSON null body', body: 'null', empty: false },
        {
          label: 'a JSON "" body',
          body: '""',
          contentType: 'application/json',
          empty: false,
        },
        {
          label: 'a JSON "   " body',
          body: '"   "',
          contentType: 'application/json',
          empty: false,
        },
        { label: 'a plain-text body', body: 'x', empty: false },
      ])(
        'records $label as hasEmptyBody=$empty',
        async ({ body, contentType, empty }) => {
          actionReplies = [
            () =>
              new Response(body, {
                status: 403,
                headers: contentType ? { 'Content-Type': contentType } : {},
              }),
          ]

          const error = await caught(call())

          expect(error).toMatchObject({
            reason: 'HTTP',
            upstreamStatus: 403,
            hasEmptyBody: empty,
          })
        },
      )

      it.each([403, 404])(
        'records a Bearer WWW-Authenticate on an empty %i as no challenge (only a 401 is one)',
        async (status) => {
          actionReplies = [
            () =>
              new Response(null, {
                status,
                headers: { 'WWW-Authenticate': 'Bearer' },
              }),
          ]

          const error = await caught(call())

          expect(error).toMatchObject({
            upstreamStatus: status,
            hasEmptyBody: true,
            hasBearerChallenge: false,
          })
        },
      )

      it('a Bearer challenge that persists after the token refresh is definitive', async () => {
        loginReplies = [
          () => json({ token: TOKEN_1 }),
          () => json({ token: TOKEN_2 }),
        ]
        actionReplies = [() => bearerChallenge()]

        const error = await caught(call())

        expect(error).toMatchObject({
          reason: 'HTTP',
          upstreamStatus: 401,
          hasEmptyBody: true,
          hasBearerChallenge: true,
        })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        expect(loginRequests()).toHaveLength(2)
        expect(actionRequests()).toHaveLength(2)
      })

      it('a Bearer challenge after another scheme is definitive and retried once', async () => {
        loginReplies = [
          () => json({ token: TOKEN_1 }),
          () => json({ token: TOKEN_2 }),
        ]
        actionReplies = [() => bearerChallenge(LATER_BEARER)]

        const error = await caught(call())

        expect(error).toMatchObject({
          reason: 'HTTP',
          upstreamStatus: 401,
          hasEmptyBody: true,
          hasBearerChallenge: true,
        })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        expect(loginRequests()).toHaveLength(2)
        expect(actionRequests()).toHaveLength(2)
      })

      it.each<{ label: string; reply: Reply }>([
        { label: 'no body', reply: () => bearerChallenge() },
        {
          label: 'a bare Bearer header',
          reply: () => bearerChallenge('Bearer'),
        },
        {
          label: 'a lower-case scheme',
          reply: () => bearerChallenge('bearer realm="one"'),
        },
        {
          label: 'Bearer as a later challenge',
          reply: () => bearerChallenge(LATER_BEARER),
        },
        {
          label: 'a whitespace-only body',
          reply: () =>
            new Response('  \n', {
              status: 401,
              headers: { 'WWW-Authenticate': 'Bearer' },
            }),
        },
      ])(
        'a Bearer challenge with $label logs in again and retries once',
        async ({ reply }) => {
          loginReplies = [
            () => json({ token: TOKEN_1 }),
            () => json({ token: TOKEN_2 }),
          ]
          actionReplies = [reply, () => success()]

          await expect(call()).resolves.toBeDefined()

          expect(loginRequests()).toHaveLength(2)
          expect(
            actionRequests().map((r) => r.headers.get('Authorization')),
          ).toEqual([`Bearer ${TOKEN_1}`, `Bearer ${TOKEN_2}`])
        },
      )

      it('a Bearer challenge retried into a 401 with a body is not definitive', async () => {
        loginReplies = [
          () => json({ token: TOKEN_1 }),
          () => json({ token: TOKEN_2 }),
        ]
        actionReplies = [() => bearerChallenge(), () => bareProblemDetails(401)]

        const error = await caught(call())

        expect(error).toMatchObject({
          upstreamStatus: 401,
          hasEmptyBody: false,
        })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
        expect(actionRequests()).toHaveLength(2)
      })

      it('a Bearer challenge retried into an empty 401 without one is not definitive', async () => {
        loginReplies = [
          () => json({ token: TOKEN_1 }),
          () => json({ token: TOKEN_2 }),
        ]
        actionReplies = [() => bearerChallenge(), bareEmpty401]

        const error = await caught(call())

        expect(error).toMatchObject({
          upstreamStatus: 401,
          hasEmptyBody: true,
          hasBearerChallenge: false,
        })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
        expect(actionRequests()).toHaveLength(2)
      })

      it.each<{
        label: string
        reply: Reply
        empty: boolean
      }>([
        {
          label: 'no WWW-Authenticate (Unauthorized(null) from the action)',
          reply: bareEmpty401,
          empty: true,
        },
        {
          label: 'a whitespace-only body and no WWW-Authenticate',
          reply: () => new Response(' \n', { status: 401 }),
          empty: true,
        },
        {
          label: 'a non-Bearer challenge',
          reply: () => bearerChallenge('Basic realm="one"'),
          empty: true,
        },
        {
          label: 'a scheme that merely starts with Bearer',
          reply: () => bearerChallenge('BearerX'),
          empty: true,
        },
        {
          label: 'a later scheme that merely starts with Bearer',
          reply: () => bearerChallenge('Negotiate, BearerX'),
          empty: true,
        },
        {
          label: 'a scheme that merely ends with Bearer',
          reply: () => bearerChallenge('XBearer realm="one"'),
          empty: true,
        },
        {
          label: 'a later scheme that merely ends with Bearer',
          reply: () => bearerChallenge('Negotiate, XBearer x'),
          empty: true,
        },
        {
          label: 'a Bearer challenge on a body',
          reply: () =>
            new Response('Unauthorized', {
              status: 401,
              headers: { 'WWW-Authenticate': 'Bearer' },
            }),
          empty: false,
        },
      ])(
        'a 401 with $label is sent exactly once and is not definitive',
        async ({ reply, empty }) => {
          loginReplies = [
            () => json({ token: TOKEN_1 }),
            () => json({ token: TOKEN_2 }),
          ]
          actionReplies = [reply, () => success()]

          const error = await caught(call())

          expect(error).toMatchObject({
            reason: 'HTTP',
            upstreamStatus: 401,
            hasEmptyBody: empty,
            hasBearerChallenge: false,
          })
          expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
          expect(actionRequests()).toHaveLength(1)
          expect(loginRequests()).toHaveLength(1)
        },
      )

      it.each<{ label: string; reply: Reply }>([
        { label: 'a One GeneralResponse', reply: () => generalResponse(401) },
        {
          label: 'a ProblemDetails (a bare Unauthorized() from the action)',
          reply: () => bareProblemDetails(401),
        },
        {
          label: 'a plain-text body',
          reply: () => new Response('Unauthorized', { status: 401 }),
        },
        {
          label: 'a literal {} body',
          reply: () => new Response('{}', { status: 401 }),
        },
        {
          label: 'a JSON "" body (Unauthorized(string.Empty) from the action)',
          reply: () => json('', { status: 401 }),
        },
        {
          label: 'a JSON "   " body',
          reply: () => json('   ', { status: 401 }),
        },
      ])(
        'a 401 with $label is sent exactly once and is not definitive',
        async ({ reply }) => {
          loginReplies = [
            () => json({ token: TOKEN_1 }),
            () => json({ token: TOKEN_2 }),
          ]
          actionReplies = [reply, () => success()]

          const error = await caught(call())

          expect(error).toMatchObject({
            reason: 'HTTP',
            upstreamStatus: 401,
            hasEmptyBody: false,
          })
          expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
          expect(actionRequests()).toHaveLength(1)
          expect(loginRequests()).toHaveLength(1)
        },
      )

      it('reads ErrorNumber and ErrorMessage off a non-2xx GeneralResponse', async () => {
        actionReplies = [() => generalResponse(400, '99')]

        const error = await caught(call())

        expect(error).toMatchObject({
          upstreamStatus: 400,
          hasGeneralResponseBody: true,
          isValidationProblemBody: false,
          errorNumber: '99',
          errorMessage: 'Villa',
        })
      })
    })

    it.each([
      ['text/plain', 'text/plain; charset=utf-8'],
      ['no Content-Type', null],
    ])('JSON-parses a body sent as %s', async (_label, contentType) => {
      actionReplies = [
        () => json({ Success: true, ItemID: 'case-9' }, { contentType }),
      ]

      await expect(createCase()).resolves.toMatchObject({
        caseItemId: 'case-9',
      })
    })

    it.each([
      ['a non-JSON body', () => new Response('<html>ok</html>')],
      ['an empty body', () => new Response('', { status: 200 })],
      ['a body without Success', () => json({ ItemID: 'case-1' })],
      ['a string Success', () => json({ Success: 'true', ItemID: 'case-1' })],
    ])(
      '%s is an unclear UNEXPECTED_RESPONSE failure',
      async (_label, reply) => {
        actionReplies = [reply]

        const error = await caught(createCase())

        expect(error).toMatchObject({ reason: 'UNEXPECTED_RESPONSE' })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(false)
      },
    )

    it('returns a null case number when One omits it', async () => {
      actionReplies = [() => success({ ItemID: 'case-1' })]

      await expect(createCase()).resolves.toEqual({
        caseItemId: 'case-1',
        caseNumber: null,
      })
    })
  })

  describe('logging', () => {
    it('never logs the password, a token, a kennitala or the document bytes', async () => {
      loginReplies = [
        () => json({ token: TOKEN_1 }),
        () => json({ token: TOKEN_2 }),
      ]
      actionReplies = [
        () => new Response(null, { status: 401 }),
        () => success(),
        () => json({ Success: false, ErrorNumber: '1' }),
        () => json({ Success: false, ErrorNumber: '1' }),
      ]

      await createCase()
      await caught(
        service.createDocument({ caseItemId: 'c', subject: 's', file: PDF }),
      )
      await caught(sendDocToIslandIs())

      // Force a fresh Login whose body is an unrecognised shape.
      service = new OneSystemsService(logger as never)
      loginReplies = [() => json({ unexpected: TOKEN_2 })]
      await caught(createCase())

      const logged = loggedText()
      expect(logger.info).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
      for (const secret of [
        PASSWORD,
        TOKEN_1,
        TOKEN_2,
        NATIONAL_ID,
        PDF.toString('base64'),
      ]) {
        expect(logged).not.toContain(secret)
      }
    })

    it('never logs a response body or One’s ErrorMessage, even when they echo the kennitala, name and subject', async () => {
      const echo = `IDNumber ${COMPANY_NATIONAL_ID} (${CUSTOMER_NAME}), Subject "${SUBJECT}"`
      const echoingReplies: Array<Reply> = [
        // ASP.NET validation echoing the input.
        () =>
          json(
            {
              title: 'One or more validation errors occurred.',
              status: 400,
              errors: { IDNumber: [echo], CustomerName: [CUSTOMER_NAME] },
            },
            { status: 400 },
          ),
        // A plain-text 500 echoing it.
        () => new Response(`Server error: ${echo}`, { status: 500 }),
        // One's own GeneralResponse on a 400 echoing it.
        () =>
          json(
            { Success: false, ErrorNumber: '7', ErrorMessage: echo },
            { status: 400 },
          ),
        // Success:false echoing it, with an ErrorNumber that is not a code.
        () => json({ Success: false, ErrorNumber: echo, ErrorMessage: echo }),
        // Code-shaped, but a bare or hyphenated kennitala.
        () => json({ Success: false, ErrorNumber: COMPANY_NATIONAL_ID }),
        () =>
          json({ Success: false, ErrorNumber: COMPANY_NATIONAL_ID_HYPHENATED }),
        () =>
          json(
            { Success: false, ErrorNumber: COMPANY_NATIONAL_ID_HYPHENATED },
            { status: 500 },
          ),
        // A transport error whose message quotes the body.
        () => Promise.reject(new SyntaxError(`Unexpected token in "${echo}"`)),
      ]

      // Every echoing reply is sent to both operations.
      const errors: Array<unknown> = []
      for (const reply of echoingReplies) {
        actionReplies = [reply]
        errors.push(
          await caught(
            service.createCase({
              nationalId: COMPANY_NATIONAL_ID,
              customerName: CUSTOMER_NAME,
              caseType: 'JAFN-OVERDUE',
            }),
          ),
        )
        actionReplies = [reply]
        errors.push(
          await caught(
            service.createDocument({
              caseItemId: 'case-1',
              subject: SUBJECT,
              file: PDF,
            }),
          ),
        )
      }

      expect(errors).toHaveLength(echoingReplies.length * 2)
      expect(logger.error).toHaveBeenCalled()
      const logged = loggedText()
      for (const pii of [
        COMPANY_NATIONAL_ID,
        COMPANY_NATIONAL_ID_HYPHENATED,
        CUSTOMER_NAME,
        SUBJECT,
      ]) {
        expect(logged).not.toContain(pii)
      }
      // What is logged instead.
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          operation: 'CreateCase',
          status: 400,
          bodyLength: expect.any(Number),
        }),
      )
      // One's text is still available to the caller, on the error only.
      expect(errors).toContainEqual(
        expect.objectContaining({ reason: 'HTTP', errorMessage: echo }),
      )
      for (const error of errors) {
        // What the exception filters and the logger see of a thrown error.
        const serialised = [
          (error as Error).message,
          JSON.stringify(error),
          JSON.stringify({ exception: error }),
          inspect(error, { depth: 10 }),
          JSON.stringify((error as OneSystemsError).getResponse()),
        ]
        for (const text of serialised) {
          for (const pii of [
            COMPANY_NATIONAL_ID,
            COMPANY_NATIONAL_ID_HYPHENATED,
            CUSTOMER_NAME,
            SUBJECT,
          ]) {
            expect(text).not.toContain(pii)
          }
        }
      }
    })
  })
})
