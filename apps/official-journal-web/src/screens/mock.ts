import { Paging } from '@dmr.is/shared/dto'

export type MockCasesType = {
  paging: Paging
  items: {
    id: string
    labels: string[]
    publicationDate: string
    registrationDate: string
    department: string
    title: string
    employee?: string
  }[]
}

export const mockSubmittedCasesResponse: MockCasesType = {
  paging: {
    page: 1,
    totalPages: 1,
    totalItems: 7,
    nextPage: null,
    previousPage: null,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  items: [
    {
      id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
      labels: ['fasttrack'],
      publicationDate: '2023-12-06T00:00:00.000Z',
      registrationDate: '2023-12-01T00:00:00.000Z',
      department: 'A-deild',
      title: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
    },
    {
      id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
      labels: [],
      publicationDate: '2023-12-07T00:00:00.000Z',
      registrationDate: '2023-12-02T00:00:00.000Z',
      department: 'B-deild',
      title:
        'REGLUGERÐ um (6.) breytingu á reglugerð nr. 454/2022 um gildistöku framkvæmdarreglugerðar framkvæmdastjórnarinnar (ESB) 2020/2235 frá 16. desember 2020 um reglur um beitingu reglugerða Evrópuþingsins og ráðsins (ESB) 2016/429 og (ESB) 2017/625 að því er varðar fyrirmyndir að dýraheilbrigðisvottorðum, fyrirmyndir að opinberum vottorðum og fyrirmyndir að dýraheilbrigðisvottorðum/opinberum vottorðum vegna komu inn í Sambandið og tilflutninga innan Sambandsins á sendingum af tilteknum flokkum dýra og vara og opinbera vottun að því er varðar slík vottorð og um niðurfellingu á reglugerð (EB) nr. 599/2004, framkvæmdarreglugerðum (ESB) nr. 636/2014 og (ESB) 2019/628, tilskipun 98/68/EB og ákvörðunum 2000/572/EB, 2003/572/EB og 2007/240/EB.',
    },
    {
      id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
      labels: [],
      publicationDate: '2023-12-08T00:00:00.000Z',
      registrationDate: '2023-12-03T00:00:00.000Z',
      department: 'C-deild',
      title:
        'GJALDSKRÁ fyrir stuðningsþjónustu í Múlaþingi samkvæmt lögum um félagsþjónustu sveitarfélaga.',
    },
    {
      id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
      labels: ['fasttrack', 'info'],
      publicationDate: '2023-12-09T00:00:00.000Z',
      registrationDate: '2023-12-04T00:00:00.000Z',
      department: 'C-deild',
      title: 'AUGLÝSING um breytingar á deiliskipulagi í Akraneskaupstað.',
    },
    {
      id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
      labels: [],
      publicationDate: '2023-12-10T00:00:00.000Z',
      registrationDate: '2023-12-05T00:00:00.000Z',
      department: 'C-deild',
      title:
        'AUGLÝSING um skrá yfir þau störf hjá Múlaþingi sem eru undanskilin verkfallsheimild',
    },
    {
      id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
      labels: [],
      publicationDate: '2023-12-11T00:00:00.000Z',
      registrationDate: '2023-12-06T00:00:00.000Z',
      department: 'B-deild',
      title:
        'SAMÞYKKT um gatnagerðargjald, byggingarleyfisgjald og þjónustugjöld byggingarfulltrúa og skipulagsfulltrúa í Múlaþingi',
    },
    {
      id: 'e6d7c050-a462-4183-972a-5c375e6e348d',
      labels: ['fasttrack', 'warning'],
      publicationDate: '2023-12-12T00:00:00.000Z',
      registrationDate: '2023-12-07T00:00:00.000Z',
      department: 'A-deild',
      title: 'GJALDSKRÁ leikskóladeildar Seyðisfjarðarskóla í Múlaþingi',
    },
  ],
}

export const mockInProgressCasesResponse: MockCasesType = {
  paging: {
    page: 1,
    totalPages: 1,
    totalItems: 11,
    nextPage: null,
    previousPage: null,
    pageSize: 10,
    hasNextPage: true,
    hasPreviousPage: false,
  },
  items: [
    {
      id: '8',
      labels: ['fasttrack', 'info'],
      publicationDate: '2023-12-12T00:00:00.000Z',
      registrationDate: '2023-12-07T00:00:00.000Z',
      department: 'A-deild',
      title: 'GJALDSKRÁ leikskóladeildar Seyðisfjarðarskóla í Múlaþingi',
      employee: 'Jón Jónsson',
    },
    {
      id: '9',
      labels: [],
      publicationDate: '2023-12-13T00:00:00.000Z',
      registrationDate: '2023-12-08T00:00:00.000Z',
      department: 'B-deild',
      title:
        'SAMÞYKKT um gatnagerðargjald, byggingarleyfisgjald og þjónustugjöld byggingarfulltrúa og skipulagsfulltrúa í Múlaþingi',
      employee: 'Jón Jónsson',
    },
    {
      id: '10',
      labels: [],
      publicationDate: '2023-12-14T00:00:00.000Z',
      registrationDate: '2023-12-09T00:00:00.000Z',
      department: 'C-deild',
      title:
        'AUGLÝSING um skrá yfir þau störf hjá Múlaþingi sem eru undanskilin verkfallsheimild',
      employee: 'Jón Jónsson',
    },
    {
      id: '11',
      labels: [],
      publicationDate: '2023-12-15T00:00:00.000Z',
      registrationDate: '2023-12-10T00:00:00.000Z',
      department: 'C-deild',
      title: 'AUGLÝSING um breytingar á deiliskipulagi í Akraneskaupstað.',
      employee: 'Jón Jónsson',
    },
    {
      id: '12',
      labels: ['fasttrack', 'warning'],
      publicationDate: '2023-12-16T00:00:00.000Z',
      registrationDate: '2023-12-11T00:00:00.000Z',
      department: 'C-deild',
      title:
        'GJALDSKRÁ fyrir stuðningsþjónustu í Múlaþingi samkvæmt lögum um félagsþjónustu sveitarfélaga.',
      employee: 'Jón Jónsson',
    },
    {
      id: '13',
      labels: [],
      publicationDate: '2023-12-17T00:00:00.000Z',
      registrationDate: '2023-12-12T00:00:00.000Z',
      department: 'B-deild',
      title:
        'REGLUGERÐ um (6.) breytingu á reglugerð nr. 454/2022 um gildistöku framkvæmdarreglugerðar framkvæmdastjórnarinnar (ESB) 2020/2235 frá 16. desember 2020 um reglur um beitingu reglugerða Evrópuþingsins og ráðsins (ESB) 2016/429 og (ESB) 2017/625 að því er varðar fyrirmyndir að dýraheilbrigðisvottorðum, fyrirmyndir að opinberum vottorðum og fyrirmyndir að dýraheilbrigðisvottorðum/opinberum vottorðum vegna komu inn í Sambandið og tilflutninga innan Sambandsins á sendingum af tilteknum flokkum dýra og vara og opinbera vottun að því er varðar slík vottorð og um niðurfellingu á reglugerð (EB) nr. 599/2004, framkvæmdarreglugerðum (ESB) nr. 636/2014 og (ESB) 2019/628, tilskipun 98/68/EB og ákvörðunum 2000/572/EB, 2003/572/EB og 2007/240/EB.',
      employee: 'Jón Jón',
    },
    {
      id: '14',
      labels: ['fasttrack'],
      publicationDate: '2023-12-18T00:00:00.000Z',
      registrationDate: '2023-12-13T00:00:00.000Z',
      department: 'A-deild',
      title: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
      employee: 'Jón Jónsson',
    },
    {
      id: '15',
      labels: [],
      publicationDate: '2023-12-19T00:00:00.000Z',
      registrationDate: '2023-12-14T00:00:00.000Z',
      department: 'A-deild',
      title: 'GJALDSKRÁ leikskóladeildar Seyðisfjarðarskóla í Múlaþingi',
      employee: 'Jón Jónsson',
    },
    {
      id: '16',
      labels: [],
      publicationDate: '2023-12-20T00:00:00.000Z',
      registrationDate: '2023-12-15T00:00:00.000Z',
      department: 'B-deild',
      title:
        'SAMÞYKKT um gatnagerðargjald, byggingarleyfisgjald og þjónustugjöld byggingarfulltrúa og skipulagsfulltrúa í Múlaþingi',
      employee: 'Jón Jónsson',
    },
    {
      id: '17',
      labels: [],
      publicationDate: '2023-12-21T00:00:00.000Z',
      registrationDate: '2023-12-16T00:00:00.000Z',
      department: 'C-deild',
      title:
        'AUGLÝSING um skrá yfir þau störf hjá Múlaþingi sem eru undanskilin verkfallsheimild',
      employee: 'Jón Jónsson',
    },
    {
      id: '18',
      labels: [],
      publicationDate: '2023-12-22T00:00:00.000Z',
      registrationDate: '2023-12-17T00:00:00.000Z',
      department: 'C-deild',
      title: 'AUGLÝSING um breytingar á deiliskipulagi í Akraneskaupstað.',
      employee: 'Jón Jónsson',
    },
    {
      id: '19',
      labels: ['fasttrack', 'warning'],
      publicationDate: '2023-12-23T00:00:00.000Z',
      registrationDate: '2023-12-18T00:00:00.000Z',
      department: 'C-deild',
      title:
        'GJALDSKRÁ fyrir stuðningsþjónustu í Múlaþingi samkvæmt lögum um félagsþjónustu sveitarfélaga.',
      employee: 'Jón Jónsson',
    },
  ],
}
