'use client'

import { ApplicationFooter } from '../../../../../../components/client-components/application/footer/ApplicationFooter'
import { BankruptcyFooter } from '../../../../../../components/client-components/application/footer/BankruptcyFooter'
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
