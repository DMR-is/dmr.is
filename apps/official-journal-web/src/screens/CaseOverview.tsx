import {
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
} from '@island.is/island-ui/core'
import { withMainLayout } from '../layout/Layout'
import {
  CaseTableSubmitted,
  SubmittedCaseData as CaseData,
} from '../components/tables/CaseTableSubmitted'
import { messages } from '../lib/messages'
import { Screen } from '../lib/types'
import { CaseFilters } from '../components/case-filters/CaseFilters'

const mockCaseData: CaseData[] = [
  {
    id: '1',
    labels: ['fasttrack'],
    publicationDate: '2023-12-06T00:00:00.000Z',
    registrationDate: '2023-12-01T00:00:00.000Z',
    department: 'A-deild',
    name: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
  },
  {
    id: '2',
    labels: [],
    publicationDate: '2023-12-07T00:00:00.000Z',
    registrationDate: '2023-12-02T00:00:00.000Z',
    department: 'B-deild',
    name: 'REGLUGERÐ um (6.) breytingu á reglugerð nr. 454/2022 um gildistöku framkvæmdarreglugerðar framkvæmdastjórnarinnar (ESB) 2020/2235 frá 16. desember 2020 um reglur um beitingu reglugerða Evrópuþingsins og ráðsins (ESB) 2016/429 og (ESB) 2017/625 að því er varðar fyrirmyndir að dýraheilbrigðisvottorðum, fyrirmyndir að opinberum vottorðum og fyrirmyndir að dýraheilbrigðisvottorðum/opinberum vottorðum vegna komu inn í Sambandið og tilflutninga innan Sambandsins á sendingum af tilteknum flokkum dýra og vara og opinbera vottun að því er varðar slík vottorð og um niðurfellingu á reglugerð (EB) nr. 599/2004, framkvæmdarreglugerðum (ESB) nr. 636/2014 og (ESB) 2019/628, tilskipun 98/68/EB og ákvörðunum 2000/572/EB, 2003/572/EB og 2007/240/EB.',
  },
  {
    id: '3',
    labels: [],
    publicationDate: '2023-12-08T00:00:00.000Z',
    registrationDate: '2023-12-03T00:00:00.000Z',
    department: 'C-deild',
    name: 'GJALDSKRÁ fyrir stuðningsþjónustu í Múlaþingi samkvæmt lögum um félagsþjónustu sveitarfélaga.',
  },
  {
    id: '4',
    labels: ['fasttrack', 'info'],
    publicationDate: '2023-12-09T00:00:00.000Z',
    registrationDate: '2023-12-04T00:00:00.000Z',
    department: 'D-deild',
    name: 'AUGLÝSING um breytingar á deiliskipulagi í Akraneskaupstað.',
  },
  {
    id: '5',
    labels: [],
    publicationDate: '2023-12-10T00:00:00.000Z',
    registrationDate: '2023-12-05T00:00:00.000Z',
    department: 'C-deild',
    name: 'AUGLÝSING um skrá yfir þau störf hjá Múlaþingi sem eru undanskilin verkfallsheimild',
  },
  {
    id: '6',
    labels: [],
    publicationDate: '2023-12-11T00:00:00.000Z',
    registrationDate: '2023-12-06T00:00:00.000Z',
    department: 'B-deild',
    name: 'SAMÞYKKT um gatnagerðargjald, byggingarleyfisgjald og þjónustugjöld byggingarfulltrúa og skipulagsfulltrúa í Múlaþingi',
  },
  {
    id: '7',
    labels: ['fasttrack', 'warning'],
    publicationDate: '2023-12-12T00:00:00.000Z',
    registrationDate: '2023-12-07T00:00:00.000Z',
    department: 'A-deild',
    name: 'GJALDSKRÁ leikskóladeildar Seyðisfjarðarskóla í Múlaþingi',
  },
]

type Props = {
  caseData: CaseData[]
}

const CaseOverviewPage: Screen<Props> = ({ caseData }) => {
  return (
    <>
      <GridContainer>
        <GridRow rowGap={['p2', 3]}>
          <GridColumn
            offset={['0', '0', '0', '1/12']}
            span={['12/12', '12/12', '12/12', '10/12']}
          >
            <CaseFilters />
          </GridColumn>
          <GridColumn
            offset={['0', '0', '0', '1/12']}
            span={['12/12', '12/12', '12/12', '10/12']}
          >
            <CaseTableSubmitted data={caseData} />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}

CaseOverviewPage.getProps = async () => {
  return {
    caseData: mockCaseData,
  }
}

export default withMainLayout(CaseOverviewPage, {
  bannerProps: {
    showBanner: true,
    imgSrc: '/assets/banner-small-image.svg',
    title: messages.components.ritstjornBanner.title,
    description: messages.components.ritstjornBanner.description,
    variant: 'small',
  },
})
