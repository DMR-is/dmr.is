import { ApplicationTypes } from '../../components/client-components/application/ApplicationTypes'
import { UmsoknirHero } from '../../components/client-components/hero/UmsoknirHero'

export default async function UmsoknirPage() {
  return (
    <>
      <UmsoknirHero />
      <ApplicationTypes />
    </>
  )
}
