import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CaseProcessingOverview from '../../screens/CaseProcessingOverview'

const Screen = withDmr(CaseProcessingOverview)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
