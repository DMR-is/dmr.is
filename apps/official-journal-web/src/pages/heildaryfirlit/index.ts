import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
import CaseOverview from '../../screens/CaseOverview'

const Screen = withDmr(CaseOverview)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
