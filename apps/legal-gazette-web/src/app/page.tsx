import { default as dynamicImport } from 'next/dynamic'

import { ApplicationContainer } from '../components/client-components/front-page/ApplicationContainer'
import { HeroContainer } from '../components/client-components/front-page/HeroContainer'

const SectionContainer = dynamicImport(
  () =>
    import('../components/client-components/front-page/SectionContainer').then(
      (mod) => mod.SectionContainer,
    ),
  {
    ssr: false,
  },
)

export const dynamic = 'force-dynamic'

export default async function IndexPage() {
  return (
    <>
      <HeroContainer />
      <SectionContainer />
      <ApplicationContainer />
    </>
  )
}
