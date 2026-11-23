import { describeOpenApiDrift } from './drift'

const doc = (overrides: Record<string, unknown> = {}) => ({
  openapi: '3.0.0',
  info: { title: 'API', version: '1.0' },
  paths: {
    '/api/v1/things/{id}': {
      get: {
        operationId: 'getThing',
        parameters: [
          { name: 'id', in: 'path', required: true },
          { name: 'expand', in: 'query', required: false },
        ],
        security: [{ bearer: [] }],
      },
    },
  },
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } },
    schemas: {
      ThingDto: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  },
  ...overrides,
})

describe('describeOpenApiDrift', () => {
  it('reports nothing for identical documents', () => {
    expect(describeOpenApiDrift(doc(), doc())).toEqual([])
  })

  it('ignores parameter order and object key order', () => {
    const reordered = doc()
    const op = reordered.paths['/api/v1/things/{id}'].get
    op.parameters.reverse()
    reordered.components.schemas.ThingDto = {
      required: ['id'],
      properties: { id: { type: 'string' } },
      type: 'object',
    }
    expect(describeOpenApiDrift(reordered, doc())).toEqual([])
  })

  it('ignores undefined keys, as the wire does', () => {
    const served = doc()
    ;(served.components.schemas.ThingDto as Record<string, unknown>)[
      'description'
    ] = undefined
    expect(describeOpenApiDrift(served, doc())).toEqual([])
  })

  it('reports added, removed and changed operations', () => {
    const served = doc()
    ;(served.paths as Record<string, unknown>)['/api/v1/new'] = {
      post: { operationId: 'createNew' },
    }
    const committed = doc()
    delete (
      committed.paths['/api/v1/things/{id}'].get as Record<string, unknown>
    )['security']
    ;(committed.paths as Record<string, unknown>)['/api/v1/old'] = {
      get: { operationId: 'getOld' },
    }

    expect(describeOpenApiDrift(served, committed)).toEqual([
      '~ operation GET /api/v1/things/{id} (getThing)',
      '+ operation POST /api/v1/new (createNew)',
      '- operation GET /api/v1/old (getOld)',
    ])
  })

  it('reports added, removed and changed schemas', () => {
    const served = doc()
    served.components.schemas.ThingDto.required = []
    ;(served.components.schemas as Record<string, unknown>)['NewDto'] = {}
    const committed = doc()
    ;(committed.components.schemas as Record<string, unknown>)['OldDto'] = {}

    expect(describeOpenApiDrift(served, committed)).toEqual([
      '~ schema ThingDto',
      '+ schema NewDto',
      '- schema OldDto',
    ])
  })

  it('reports a changed security scheme', () => {
    const served = doc()
    delete (served.components as Record<string, unknown>)['securitySchemes']
    expect(describeOpenApiDrift(served, doc())).toEqual([
      '~ components (other than schemas)',
    ])
  })

  it('keeps other arrays ordered, so a reordered enum is reported', () => {
    const withEnum = (values: string[]) =>
      doc({
        components: {
          schemas: { Kind: { type: 'string', enum: values } },
        },
      })
    expect(
      describeOpenApiDrift(withEnum(['a', 'b']), withEnum(['b', 'a'])),
    ).toEqual(['~ schema Kind'])
  })

  it('reports changed document metadata', () => {
    expect(
      describeOpenApiDrift(
        doc({ info: { title: 'API', version: '2.0' } }),
        doc(),
      ),
    ).toEqual(['~ document metadata'])
  })
})
