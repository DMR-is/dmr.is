import { Case } from '../gen/fetch'
import { withMainLayout } from '../layout/Layout'
import { Screen } from '../lib/types'

type Props = {
  cases: Case[]
}

const CaseOverview: Screen<Props> = ({ cases }) => {
  return <div></div>
}

CaseOverview.getProps = async () => {
  return {
    cases: [],
  }
}

export default withMainLayout(CaseOverview)
