import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import {
  assertIdentityGuarded,
  assertTokenSurface,
  ISLAND_IS_APPLICATION_SCOPE,
  PARTNER_WEB_SCOPE,
} from '../../core/guards/token-surface/token-surface.testing'
import { ApplicationApiKeyController } from './application-api-key.controller'

/**
 * Company API keys are self-service on both channels: My Pages on island.is
 * and partner-web both reach these routes, so both scopes are admitted.
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

    it('that guard admits its own surface and refuses any other token', async () => {
      await expect(
        assertTokenSurface(CompanyResourceGuard, {
          accepts: [ISLAND_IS_APPLICATION_SCOPE, PARTNER_WEB_SCOPE],
        }),
      ).resolves.toBeUndefined()
    })
  })
})
