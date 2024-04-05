import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CaseOverview from '../../screens/CaseOverview'

const Screen = withDmr(CaseOverview)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
