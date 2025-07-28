'use client'

import { BankruptcyApplicationDto, CourtDistrictDto } from '../../../gen/fetch'
import { BankruptcyApplication } from './BankruptcyApplication'

type Props = {
  application: BankruptcyApplicationDto
  locations: CourtDistrictDto[]
}

export const BankruptcyApplicationScreen = ({
  application,
  locations,
}: Props) => {
  return (
    <BankruptcyApplication locations={locations} initalState={application} />
  )
}
