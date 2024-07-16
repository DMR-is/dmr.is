import withDmr from '../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../lib/getServerSidePropsWrapper'
import ErrorScreen from '../screens/Error/Error'

const Screen = withDmr(ErrorScreen)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
