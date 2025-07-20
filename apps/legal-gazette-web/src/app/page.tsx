import dynamic from 'next/dynamic'

import { ApplicationContainer } from '../components/client-components/front-page/ApplicationContainer'
import { HeroContainer } from '../components/client-components/front-page/HeroContainer'

const SectionContainer = dynamic(
  () =>
    import('../components/client-components/front-page/SectionContainer').then(
      (mod) => mod.SectionContainer,
    ),
  {
    ssr: false,
  },
)

export default async function IndexPage() {
  return (
    <>
      <HeroContainer />
      <SectionContainer />
      <ApplicationContainer />
    </>
  )
}
