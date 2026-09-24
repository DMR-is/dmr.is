import { InternalServerErrorException } from '@nestjs/common'

import { ONESYSTEMS_DEFAULT_BASE_URL } from './onesystems.config'
import {
  isDefinitiveOneSystemsFailure,
  OneSystemsError,
} from './onesystems.errors'
import { OneSystemsService } from './onesystems.service'

const USERNAME = 'dmr-integration-user'
const PASSWORD = 'pa55-w0rd-that-must-never-be-logged'
const TOKEN_1 = 'token-one-that-must-never-be-logged'
const TOKEN_2 = 'token-two-that-must-never-be-logged'
const NATIONAL_ID = '1234567890'
const PDF = Buffer.from('%PDF-1.7 notice body')

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

describe('OneSystemsService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const originalEnv = { ...process.env }
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

    process.env = { ...originalEnv }
    delete process.env.ONESYSTEMS_API_URL
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
    process.env = originalEnv
    global.fetch = originalFetch
  })

  describe('Login and the bearer token', () => {
    it('logs in on the default base URL without a bearer token, then calls the action with one', async () => {
      actionReplies = [
        () => success({ ItemID: 'case-1', CaseNumber: '2026-9' }),
      ]

      await expect(createCase()).resolves.toEqual({
        caseItemId: 'case-1',
        caseNumber: '2026-9',
      })

      const [login, action] = requests()
      expect(login.url).toBe(`${ONESYSTEMS_DEFAULT_BASE_URL}/api/auth/Login`)
      expect(login.method).toBe('POST')
      expect(login.headers.get('Authorization')).toBeNull()
      await expect(bodyOf(login)).resolves.toEqual({
        UserName: USERNAME,
        Password: PASSWORD,
      })

      expect(action.url).toBe(
        `${ONESYSTEMS_DEFAULT_BASE_URL}/api/actions/CreateCase`,
      )
      expect(action.headers.get('Authorization')).toBe(`Bearer ${TOKEN_1}`)
    })

    it('reads ONESYSTEMS_API_URL at call time and tolerates a trailing slash', async () => {
      process.env.ONESYSTEMS_API_URL = 'https://one.test/OneExternalAPI/'
      actionReplies = [() => success()]

      await createCase()

      expect(requests().map((r) => r.url)).toEqual([
        'https://one.test/OneExternalAPI/api/auth/Login',
        'https://one.test/OneExternalAPI/api/actions/CreateCase',
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

        const error = await caught(createCase())

        expect(error).toMatchObject({ operation: 'Login', reason })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(true)
        expect(actionRequests()).toHaveLength(0)
      },
    )

    it.each(['ONESYSTEMS_USERNAME', 'ONESYSTEMS_PASSWORD'])(
      'throws before any request when %s is missing',
      async (name) => {
        delete process.env[name]

        await expect(createCase()).rejects.toThrow(InternalServerErrorException)
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
    const actions = [
      ['createCase', () => createCase()],
      [
        'createDocument',
        () =>
          service.createDocument({
            caseItemId: 'case-1',
            subject: 's',
            file: PDF,
          }),
      ],
      [
        'sendDocToIslandIs',
        () =>
          service.sendDocToIslandIs({
            documentItemId: 'doc-1',
            nationalId: NATIONAL_ID,
          }),
      ],
      ['closeCase', () => service.closeCase({ caseId: 'case-1' })],
    ] as const

    it.each(actions)(
      '%s: a 200 with Success:false is a definitive REJECTED failure carrying One’s error',
      async (_name, call) => {
        actionReplies = [
          () =>
            json({
              Success: false,
              ErrorNumber: '42',
              ErrorMessage: 'Málasniðmát fannst ekki',
              ItemID: null,
            }),
        ]

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

    it.each(actions)(
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
      'HTTP %i is an HTTP failure, definitive=%s',
      async (status, definitive) => {
        actionReplies = [() => json({ title: 'error' }, { status })]

        const error = await caught(createCase())

        expect(error).toMatchObject({ reason: 'HTTP', upstreamStatus: status })
        expect(isDefinitiveOneSystemsFailure(error)).toBe(definitive)
      },
    )

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
      await caught(
        service.sendDocToIslandIs({
          documentItemId: 'd',
          nationalId: NATIONAL_ID,
        }),
      )

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
  })
})
