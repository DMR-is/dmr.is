import { Sequelize } from 'sequelize-typescript'

import { ModulesContainer } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { AppModule } from './app.module'

/**
 * Pins the controllers the admin API mounts. Routes are wired through module
 * imports, some of them indirect (the lib `IssuesAdminModule`, for one), so a
 * dropped import turns a route the editorial web calls into a 404 without any
 * type error. Only the Sequelize connection is stubbed.
 */
describe('Admin API module surface', () => {
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

  it('mounts exactly the admin controllers', () => {
    const controllers = [...moduleRef.get(ModulesContainer).values()].flatMap(
      (m) => [...m.controllers.values()].map((w) => w.metatype?.name),
    )

    expect(controllers.sort()).toEqual([
      'AdvertTypeAdminController',
      'AdvertTypeController',
      'ApplicationController',
      'CaseController',
      'HealthController',
      'InstitutionAdminController',
      'InstitutionController',
      'IssuesAdminController',
      'IssuesController',
      'SignatureController',
      'StatisticsController',
      'UserController',
    ])
  })
})
