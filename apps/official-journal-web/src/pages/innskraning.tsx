import withDmr from '../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../lib/getServerSidePropsWrapper'
import Login from '../screens/Login'

const Screen = withDmr(Login)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
