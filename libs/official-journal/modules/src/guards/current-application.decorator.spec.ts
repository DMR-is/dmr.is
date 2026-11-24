import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'

import {
  APPLICATION_REQUEST_KEY,
  CurrentApplication,
} from './current-application.decorator'

// A param decorator's factory is only reachable through the route-args
// metadata Nest reads, so declare a method with it and pull the factory out.
class Probe {
  handler(@CurrentApplication() _application: unknown) {
    return _application
  }
}

const factory = (
  Object.values(
    Reflect.getMetadata(ROUTE_ARGS_METADATA, Probe, 'handler'),
  )[0] as { factory: (data: unknown, ctx: unknown) => unknown }
).factory

const contextFor = (req: Record<string, unknown>) => ({
  switchToHttp: () => ({ getRequest: () => req }),
})

describe('CurrentApplication', () => {
  it("returns what the guard left on the request under the guard's key", () => {
    const application = { id: 'app-1' }

    expect(
      factory(
        undefined,
        contextFor({ [APPLICATION_REQUEST_KEY]: application }),
      ),
    ).toBe(application)
  })

  it('throws on a route the guard did not run on', () => {
    expect(() => factory(undefined, contextFor({}))).toThrow(
      'CurrentApplication requires ApplicationOwnershipGuard',
    )
  })
})
