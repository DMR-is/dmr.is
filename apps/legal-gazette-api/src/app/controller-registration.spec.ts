import { Sequelize } from 'sequelize-typescript'

import { ModulesContainer } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { AppModule } from './app.module'

/**
 * Each controller is listed by exactly one module. Provider modules hold
 * services and controller modules hold routes; a controller listed in a
 * provider module is registered again through every module that imports it
 * for the service (UsersController was mounted a second time this way, via
 * AuthorizationGuardModule importing UsersProviderModule).
 */
const ALLOWED_DUPLICATES: Record<string, string> = {
  // Listed in PublicWebSwaggerModule as well as AdvertControllerModule so its
  // routes appear in the public swagger document without pulling in the other
  // advert controllers.
  AdvertPdfController: 'public swagger document',
}

describe('Controller registration', () => {
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

  it('lists each controller in exactly one module', () => {
    const owners = new Map<string, string[]>()
    for (const mod of moduleRef.get(ModulesContainer).values()) {
      for (const wrapper of mod.controllers.values()) {
        const name = String(wrapper.metatype?.name)
        owners.set(name, [
          ...(owners.get(name) ?? []),
          String(mod.metatype?.name),
        ])
      }
    }

    const duplicated = [...owners]
      .filter(([name, mods]) => mods.length > 1 && !ALLOWED_DUPLICATES[name])
      .map(([name, mods]) => `${name} in ${mods.join(', ')}`)

    expect(duplicated).toEqual([])
  })
})
