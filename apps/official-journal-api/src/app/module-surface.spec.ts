import { Sequelize } from 'sequelize-typescript'

import { ModulesContainer } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { AppModule } from './app.module'

/**
 * Pins what the public journal API loads. It used to import the whole case
 * module for one read, which mounted the staff PDF routes and a duplicate of
 * `POST /issues/generate` here and loaded the admin case, application,
 * comment and user services into the public process. A lib module that starts
 * importing one of these again should fail here, not ship.
 *
 * Only the Sequelize connection is stubbed; the module graph is the real one.
 */
describe('Public journal API module surface', () => {
  let moduleRef: TestingModule
  let modules: Set<string | undefined>
  let controllers: Set<string | undefined>

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Sequelize)
      .useValue({ repositoryMode: false, close: () => Promise.resolve() })
      .compile()

    const container = [...moduleRef.get(ModulesContainer).values()]
    modules = new Set(container.map((m) => m.metatype?.name))
    controllers = new Set(
      container.flatMap((m) =>
        [...m.controllers.values()].map((w) => w.metatype?.name),
      ),
    )
  }, 60000)

  afterAll(async () => {
    await moduleRef?.close()
  })

  it.each([
    'SharedCaseModule',
    'ApplicationModule',
    'UserModule',
    'CommentModuleV2',
    'PdfModule',
    'PdfServiceModule',
    'IssuesServiceModule',
    'RegulationsAdminModule',
  ])('does not load %s', (name) => {
    expect(modules.has(name)).toBe(false)
  })

  it('mounts only the public controllers', () => {
    expect([...controllers].sort()).toEqual([
      'AdvertTypeController',
      'HealthController',
      'IssuesController',
      'JournalController',
      'RegulationAppendicesController',
    ])
  })
})
