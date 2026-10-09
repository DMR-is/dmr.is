import Fastify, { FastifyInstance } from 'fastify'

const createChangeSuggestion = jest.fn()
const updateChangeSuggestion = jest.fn()

jest.mock('../db/ChangeSuggestion', () => ({
  createChangeSuggestion: (...args: unknown[]) =>
    createChangeSuggestion(...args),
  updateChangeSuggestion: (...args: unknown[]) =>
    updateChangeSuggestion(...args),
}))
jest.mock('../db/Regulation', () => ({}))

import {
  CHANGE_SUGGESTION_BODY_LIMIT,
  changeSuggestionRoutes,
} from './changeSuggestionRoutes'

const USER = 'cs-user'
const PASS = 'cs-pass'
const authorization =
  'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')

// Assigning `undefined` to process.env stores the string "undefined".
const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

const body = {
  regulationId: 1,
  changingId: 2,
  title: 'Titill',
  text: '<p>Texti</p>',
}

describe('POST /api/v1/change-suggestions report guard', () => {
  let app: FastifyInstance
  const savedEnv = {
    user: process.env.ROUTES_USERNAME_CHANGESUGGESTION,
    pass: process.env.ROUTES_PASSWORD_CHANGESUGGESTION,
  }

  beforeEach(async () => {
    process.env.ROUTES_USERNAME_CHANGESUGGESTION = USER
    process.env.ROUTES_PASSWORD_CHANGESUGGESTION = PASS
    createChangeSuggestion.mockReset()
    createChangeSuggestion.mockResolvedValue({ id: 10 })
    updateChangeSuggestion.mockReset()
    updateChangeSuggestion.mockResolvedValue({ id: 10 })

    app = Fastify()
    app.register(changeSuggestionRoutes, { prefix: '/api/v1' })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
    restoreEnv('ROUTES_USERNAME_CHANGESUGGESTION', savedEnv.user)
    restoreEnv('ROUTES_PASSWORD_CHANGESUGGESTION', savedEnv.pass)
  })

  const post = (payload: Record<string, unknown>) =>
    app.inject({
      method: 'POST',
      url: '/api/v1/change-suggestions',
      headers: { authorization },
      payload,
    })

  it.each([
    ['an array', []],
    ['a string', '{"version":1}'],
    ['a number', 1],
  ])('rejects report as %s with 400 before creating', async (_, report) => {
    const res = await post({ ...body, report })

    expect(res.statusCode).toBe(400)
    expect(createChangeSuggestion).not.toHaveBeenCalled()
  })

  it.each([
    ['an object', { appliedCount: 0, skippedCount: 0 }],
    ['null', null],
  ])('accepts report as %s', async (_, report) => {
    const res = await post({ ...body, report })

    expect(res.statusCode).toBe(201)
    expect(createChangeSuggestion).toHaveBeenCalledWith({ ...body, report })
  })

  it('accepts a body without report', async () => {
    const res = await post(body)

    expect(res.statusCode).toBe(201)
  })

  it('accepts a body over the 1 MiB default', async () => {
    const res = await post({ ...body, text: 'a'.repeat(2 * 1024 * 1024) })

    expect(res.statusCode).toBe(201)
  })

  it('rejects a body over the route limit with 413', async () => {
    const res = await post({
      ...body,
      text: 'a'.repeat(CHANGE_SUGGESTION_BODY_LIMIT),
    })

    expect(res.statusCode).toBe(413)
    expect(createChangeSuggestion).not.toHaveBeenCalled()
  })

  it('accepts a PUT body over the 1 MiB default', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/change-suggestions/10',
      headers: { authorization },
      payload: { text: 'a'.repeat(2 * 1024 * 1024) },
    })

    expect(res.statusCode).toBe(200)
    expect(updateChangeSuggestion).toHaveBeenCalled()
  })

  // Raising the limit is only safe because auth runs in `onRequest`, before
  // the body is parsed. Moving it to `preHandler` would keep every other test
  // green while letting anyone reach the 10 MiB parse, so pin the order: an
  // over-limit, unparseable body without valid credentials must be 401.
  it.each([
    ['no credentials', undefined],
    [
      'wrong credentials',
      'Basic ' + Buffer.from(`${USER}:nope`).toString('base64'),
    ],
  ])('rejects %s with 401 before parsing the body', async (_, header) => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/change-suggestions',
      headers: {
        'content-type': 'application/json',
        ...(header ? { authorization: header } : {}),
      },
      payload: '{' + 'a'.repeat(CHANGE_SUGGESTION_BODY_LIMIT + 10),
    })

    expect(res.statusCode).toBe(401)
    expect(createChangeSuggestion).not.toHaveBeenCalled()
  })
})
