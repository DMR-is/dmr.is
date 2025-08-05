import { BankruptcyApplicationDto } from '../../../../gen/fetch'

type Props = {
  application: BankruptcyApplicationDto
}

export const BankruptcyApplicationSubmitted = ({ application }: Props) => {
  return <div>This application has been submitted</div>
}
