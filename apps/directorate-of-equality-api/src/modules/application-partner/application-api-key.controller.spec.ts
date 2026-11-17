import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import {
  assertIdentityGuarded,
  assertTokenSurface,
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
  MY_PAGES_SCOPE,
} from '../../core/guards/token-surface/token-surface.testing'
import { ApplicationApiKeyController } from './application-api-key.controller'

/**
 * Company API keys are self-service: My Pages on island.is is the only caller,
 * so its scope is the only one admitted. An application-system token is
 * refused, because minting a key is not something a filing should do.
 */
describe('ApplicationApiKeyController', () => {
  describe('token surface (#1568)', () => {
    const methods = ['issueApiKey', 'getApiKeys', 'revokeApiKey']

    it.each(methods)('%s runs behind the identity guard', (method) => {
      expect(() =>
        assertIdentityGuarded(
          ApplicationApiKeyController,
          method,
          CompanyResourceGuard,
        ),
      ).not.toThrow()
    })

    it.each(methods)(
      '%s admits My Pages only and refuses any other token',
      async (method) => {
        await expect(
          assertTokenSurface(
            ApplicationApiKeyController,
            method,
            CompanyResourceGuard,
            {
              accepts: [MY_PAGES_SCOPE],
              refuses: [
                ISLAND_IS_APPLICATION_SCOPE,
                ISLAND_IS_SALARY_APPLICATION_SCOPE,
              ],
            },
          ),
        ).resolves.toBeUndefined()
      },
    )
  })
})
