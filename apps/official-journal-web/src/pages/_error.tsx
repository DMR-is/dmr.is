import withDmr from '../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../lib/getServerSidePropsWrapper'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ErrorScreen from '../screens/Error/Error'

const Screen = withDmr(ErrorScreen)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
