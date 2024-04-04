import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CaseSingle from '../../screens/CaseSingle'

const Screen = withDmr(CaseSingle)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
