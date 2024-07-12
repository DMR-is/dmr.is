import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
import CasePublishingOverview from '../../screens/CasePublishingOverview'

const Screen = withDmr(CasePublishingOverview)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
