'use client'

import { BankruptcyFooter } from '../../../../../../components/client-components/application/bankruptcy/BankruptcyFooter'
import { ApplicationFooter } from '../../../../../../components/client-components/application/footer/ApplicationFooter'
import { useApplicationContext } from '../../../../../../context/ApplicationContext'

export default function ThrotabusFooter() {
  const { status } = useApplicationContext()

  if (status !== 'DRAFT') {
    return null
  }

  return (
    <ApplicationFooter>
      <BankruptcyFooter />
    </ApplicationFooter>
  )
}
