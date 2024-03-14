import withDmr from '../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../lib/getServerSidePropsWrapper'
import Dashboard from '../screens/Dashboard'

const Screen = withDmr(Dashboard)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
