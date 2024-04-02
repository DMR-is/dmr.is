import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CasePublishingPage from '../../screens/CasePublish'

const Screen = withDmr(CasePublishingPage)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
