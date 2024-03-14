import withDmr from '../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../lib/getServerSidePropsWrapper'
// eslint-disable-next-line @typescript-eslint/naming-convention
import Dashboard from '../screens/Dashboard'

const Screen = withDmr(Dashboard)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
