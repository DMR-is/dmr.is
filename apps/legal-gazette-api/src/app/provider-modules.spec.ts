import { Sequelize } from 'sequelize-typescript'

import { ModulesContainer } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { AppModule } from './app.module'

/**
 * Provider modules hold services; controller modules hold routes (see the
 * two-module pattern in `.claude/rules/nestjs.md`). A controller listed in a
 * provider module is registered again by every module that imports it for
 * the service, which is how `UsersController` ended up mounted through
 * `AuthorizationGuardModule`.
 */
describe('Provider modules', () => {
  let moduleRef: TestingModule

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Sequelize)
      .useValue({ repositoryMode: false, close: () => Promise.resolve() })
      .compile()
  }, 60000)

  afterAll(async () => {
    await moduleRef?.close()
  })

  it('register no controllers', () => {
    const offenders = [...moduleRef.get(ModulesContainer).values()]
      .filter((m) => m.metatype?.name?.endsWith('ProviderModule'))
      .flatMap((m) =>
        [...m.controllers.values()].map(
          (w) => `${w.metatype?.name} in ${m.metatype?.name}`,
        ),
      )

    expect(offenders).toEqual([])
  })
})
