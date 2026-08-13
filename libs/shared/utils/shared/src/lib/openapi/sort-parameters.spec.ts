import { sortOpenApiParameters } from './sort-parameters'

describe('sortOpenApiParameters', () => {
  const namesOf = (parameters?: Array<{ in?: string; name?: string }>) =>
    (parameters ?? []).map((parameter) => `${parameter.in}:${parameter.name}`)

  it('orders parameters by `in`, then `name`', () => {
    const document = {
      paths: {
        '/cases/{department}': {
          get: {
            parameters: [
              { in: 'query', name: 'search', schema: { type: 'string' } },
              { in: 'path', name: 'department', schema: { type: 'string' } },
              { in: 'query', name: 'id', schema: { type: 'string' } },
              { in: 'header', name: 'authorization' },
            ],
          },
        },
      },
    }

    expect(namesOf(sortOpenApiParameters(document).paths['/cases/{department}'].get.parameters)).toEqual([
      'header:authorization',
      'path:department',
      'query:id',
      'query:search',
    ])
  })

  it('produces the same order regardless of the input order', () => {
    const parameters = [
      { in: 'path', name: 'department' },
      { in: 'query', name: 'id' },
      { in: 'query', name: 'search' },
    ]

    const forwards = sortOpenApiParameters({
      paths: { '/a': { get: { parameters: [...parameters] } } },
    })
    const backwards = sortOpenApiParameters({
      paths: { '/a': { get: { parameters: [...parameters].reverse() } } },
    })

    expect(forwards).toEqual(backwards)
  })

  it('keeps every parameter -- it sorts, it does not filter or dedupe', () => {
    const document = {
      paths: {
        '/a': {
          get: {
            parameters: [
              { in: 'query', name: 'id' },
              { in: 'query', name: 'id' },
              { $ref: '#/components/parameters/Locale' },
              { in: 'path', name: 'id' },
            ],
          },
        },
      },
    }

    expect(
      sortOpenApiParameters(document).paths['/a'].get.parameters,
    ).toHaveLength(4)
  })

  it('sorts reference parameters by `$ref`', () => {
    const document = {
      paths: {
        '/a': {
          get: {
            parameters: [
              { $ref: '#/components/parameters/Version' },
              { $ref: '#/components/parameters/Locale' },
            ],
          },
        },
      },
    }

    expect(
      sortOpenApiParameters(document).paths['/a'].get.parameters.map(
        (parameter) => parameter.$ref,
      ),
    ).toEqual([
      '#/components/parameters/Locale',
      '#/components/parameters/Version',
    ])
  })

  it('sorts path-item level parameters as well as operation level ones', () => {
    const document = {
      paths: {
        '/a': {
          parameters: [
            { in: 'query', name: 'zeta' },
            { in: 'path', name: 'alpha' },
          ],
          get: {
            parameters: [
              { in: 'query', name: 'zeta' },
              { in: 'path', name: 'alpha' },
            ],
          },
        },
      },
    }

    const sorted = sortOpenApiParameters(document).paths['/a']

    expect(namesOf(sorted.parameters)).toEqual(['path:alpha', 'query:zeta'])
    expect(namesOf(sorted.get.parameters)).toEqual(['path:alpha', 'query:zeta'])
  })

  it('leaves the rest of the document untouched', () => {
    const document = {
      openapi: '3.0.0',
      paths: {
        '/a': {
          get: {
            tags: ['zeta', 'alpha'],
            security: [{ bearer: [] }, { apiKey: [] }],
            parameters: [
              { in: 'query', name: 'zeta' },
              { in: 'path', name: 'alpha' },
            ],
          },
        },
      },
      components: {
        schemas: {
          Case: {
            required: ['zeta', 'alpha'],
            enum: ['C', 'A', 'B'],
          },
        },
      },
    }

    const sorted = sortOpenApiParameters(document)

    expect(sorted.paths['/a'].get.tags).toEqual(['zeta', 'alpha'])
    expect(sorted.paths['/a'].get.security).toEqual([
      { bearer: [] },
      { apiKey: [] },
    ])
    expect(sorted.components.schemas.Case.required).toEqual(['zeta', 'alpha'])
    expect(sorted.components.schemas.Case.enum).toEqual(['C', 'A', 'B'])
  })

  it('tolerates documents with no paths and operations with no parameters', () => {
    expect(sortOpenApiParameters({})).toEqual({})
    expect(sortOpenApiParameters({ paths: {} })).toEqual({ paths: {} })
    expect(
      sortOpenApiParameters({ paths: { '/a': { get: { responses: {} } } } }),
    ).toEqual({ paths: { '/a': { get: { responses: {} } } } })
  })
})
