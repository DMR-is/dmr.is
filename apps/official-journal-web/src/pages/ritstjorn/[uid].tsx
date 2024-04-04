import withDmr from '../../lib/api/withDmr'
import { getServerSidePropsWrapper } from '../../lib/getServerSidePropsWrapper'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CaseProcessingDetail from '../../screens/CaseProcessingDetail'

const Screen = withDmr(CaseProcessingDetail)

export default Screen

export const getServerSideProps = getServerSidePropsWrapper(Screen)
