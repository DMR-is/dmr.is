import Fastify, { FastifyInstance } from 'fastify'

const createChangeSuggestion = jest.fn()

jest.mock('../db/ChangeSuggestion', () => ({
  createChangeSuggestion: (...args: unknown[]) =>
    createChangeSuggestion(...args),
}))
jest.mock('../db/Regulation', () => ({}))

import { changeSuggestionRoutes } from './changeSuggestionRoutes'

const USER = 'cs-user'
const PASS = 'cs-pass'
const authorization =
  'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')

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

    app = Fastify()
    app.register(changeSuggestionRoutes, { prefix: '/api/v1' })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
    process.env.ROUTES_USERNAME_CHANGESUGGESTION = savedEnv.user
    process.env.ROUTES_PASSWORD_CHANGESUGGESTION = savedEnv.pass
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
})
