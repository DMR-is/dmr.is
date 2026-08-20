import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'

import { CompanyModel } from '../company/models/company.model'
import { CompanyEventModel } from '../company/models/company-event.model'
import { INoticePdfService } from './notice-pdf.service.interface'
import { INoticeStoreService } from './notice-store.service.interface'
import { PostholfApiModule } from './postholf.api.module'
import { IPostholfService } from './postholf.service.interface'
import { PostholfCallbackController } from './postholf-callback.controller'
import { IPostholfDocumentService } from './postholf-document.service.interface'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/**
 * Fully instantiates the Pósthólf module tree.
 *
 * `swagger-coverage.spec.ts` builds the whole app in **preview mode**, which
 * assembles the module graph without instantiating providers — so a missing
 * provider or a forgotten `exports` entry passes there and only surfaces when the
 * container boots for real. This spec closes that gap for the new module without
 * needing a database: only the two Sequelize model tokens and the AWS client are
 * substituted, and every provider is genuinely constructed.
 */
describe('PostholfApiModule wiring', () => {
  const build = () =>
    Test.createTestingModule({ imports: [PostholfApiModule] })
      .overrideProvider(LOGGER_PROVIDER)
      .useValue(mockLogger)
      .overrideProvider(getModelToken(CompanyModel))
      .useValue({ findOne: jest.fn() })
      .overrideProvider(getModelToken(CompanyEventModel))
      .useValue({ findOne: jest.fn(), create: jest.fn() })
      .overrideProvider(IAWSService)
      .useValue({ uploadObject: jest.fn(), getObjectBuffer: jest.fn() })
      .compile()

  it('resolves every provider and the controller', async () => {
    const module = await build()

    expect(module.get(IPostholfService)).toBeDefined()
    expect(module.get(INoticePdfService)).toBeDefined()
    expect(module.get(INoticeStoreService)).toBeDefined()
    expect(module.get(IPostholfDocumentService)).toBeDefined()
    expect(module.get(PostholfCallbackController)).toBeDefined()

    await module.close()
  })

  it('constructs the controller with a working document service dependency', async () => {
    const module = await build()

    const controller = module.get(PostholfCallbackController)

    // Proves the symbol-token injection actually wired up, rather than the
    // controller merely existing with an undefined dependency.
    expect(
      (controller as unknown as { documentService: unknown }).documentService,
    ).toBe(module.get(IPostholfDocumentService))

    await module.close()
  })
})
