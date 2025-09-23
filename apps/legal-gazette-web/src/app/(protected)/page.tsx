import { ApplicationContainer } from '../../components/client-components/front-page/ApplicationContainer'
import { HeroContainer } from '../../components/client-components/front-page/HeroContainer'
import { SectionContainer } from '../../components/client-components/front-page/SectionContainer'

export default async function IndexPage() {
  return (
    <>
      <HeroContainer />
      <SectionContainer />
      <ApplicationContainer />
    </>
  )
}
