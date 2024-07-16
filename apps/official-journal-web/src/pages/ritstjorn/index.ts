import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
import CaseProcessingOverview from '../../screens/CaseProcessingOverview'

const Screen = withDmr(CaseProcessingOverview)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
