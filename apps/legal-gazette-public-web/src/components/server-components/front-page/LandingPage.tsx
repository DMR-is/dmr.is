import { getBaseUrlFromServerSide } from '../../../lib/utils'
import { LandingPageContent } from '../../client-components/landing-page/LandingPage'

export const LandingPage = async () => {
  const baseUrl = getBaseUrlFromServerSide()

  return <LandingPageContent baseUrl={baseUrl} />
}
