/**
 * Every user-facing string in the partner web, in one place, following
 * directorate-of-equality-web's `lib/text.ts`. The readers are employers and
 * their representatives, not reviewers, so the wording explains what an action
 * does to the company rather than how the register records it.
 */

export const sharedText = {
  unknown: 'Óþekkt',
  cancel: 'Hætta við',
  loadErrorTitle: 'Villa kom upp',
}

export const layoutText = {
  headerTitle: 'Samstarfsaðilar Jafnréttisstofu',
  pageTitle: 'Aðgangur að skilum',
  pageIntro:
    'Hér ræður fyrirtækið hver má skila skýrslum til Jafnréttisstofu fyrir þess hönd: þjónustuaðili, til dæmis launakerfi eða bókhaldsstofa, eða fyrirtækið sjálft með eigin aðgangslykli.',
}

export const companyText = {
  heading: 'Fyrirtæki',
  name: 'Heiti',
  nationalId: 'Kennitala',
  address: 'Heimilisfang',
  email: 'Netfang',
  employeeCount: 'Fjöldi starfsmanna',
  registerStatus: 'Staða á skrá',
  statusActive: 'Virkt',
  statusInactive: 'Óvirkt',
  legalForm: 'Rekstrarform',
  isat: 'Atvinnugrein (ÍSAT)',

  obligationsHeading: 'Skilaskylda',
  equalityReport: 'Jafnréttisáætlun',
  salaryReport: 'Launagreining',
  nextDue: 'Næsti skiladagur',
  overdue: 'Kominn fram yfir skiladag',

  obligationNotRequired: 'Ekki skylt',
  obligationMissing: 'Vantar',
  obligationActionPlanMissing: 'Vantar úrbótaáætlun',
  obligationCovered: 'Í gildi',

  sizeUnknown: 'Óflokkað',
  sizeSmall: '0–24',
  sizeMedium: '25–49',
  sizeLarge: '50 eða fleiri',

  correctionHint:
    'Upplýsingarnar koma úr fyrirtækjaskrá Jafnréttisstofu. Ef eitthvað er rangt skaltu hafa samband við Jafnréttisstofu.',

  notInRegisterTitle: 'Fyrirtækið er ekki á skrá Jafnréttisstofu',
  notInRegisterMessage:
    'Kennitalan sem þú skráðir þig inn með finnst ekki í fyrirtækjaskrá Jafnréttisstofu, og því er hvorki hægt að veita umboð né búa til aðgangslykla fyrir hana. Hafðu samband við Jafnréttisstofu ef fyrirtækið á að vera á skrá.',
}

export const actorText = {
  heading: 'Innskráður umboðsaðili',
  name: 'Nafn',
  nationalId: 'Kennitala',
  actingFor: 'Kemur fram fyrir hönd',
  auditNote:
    'Umboð sem þú veitir eða afturkallar og aðgangslyklar sem þú býrð til eru skráð á þína kennitölu í sögu fyrirtækisins hjá Jafnréttisstofu.',
  selfTitle: 'Fyrirtækið er skráð inn beint',
  selfMessage:
    'Innskráningin er ekki í gegnum umboð einstaklings, svo aðgerðir hér eru skráðar á kennitölu fyrirtækisins.',
}

export const tabsText = {
  label: 'Aðgangur',
  delegations: 'Þjónustuaðilar',
  apiKeys: 'Aðgangslyklar fyrirtækis',
  providerKeys: 'Lyklar þjónustuaðila',
}

export const keyText = {
  colKeyId: 'Lyklanúmer',
  colCreated: 'Búinn til',
  colCreatedBy: 'Búinn til af',
  colExpires: 'Gildir til',
  colLastUsed: 'Síðast notaður',
  neverUsed: 'Aldrei notaður',
  noExpiry: 'Ótímabundinn',
  statusActive: 'Í gildi',
  statusRevoked: 'Afturkallaður',
  statusExpired: 'Útrunninn',
  createdViaIslandIs: 'Þjónustuvefur',
  createdViaAdmin: 'Jafnréttisstofa',
  revokeButton: 'Afturkalla',
  revokeConfirmButton: 'Afturkalla lykil',
  revokedToast: 'Aðgangslykill afturkallaður',
  revokeErrorToast: 'Villa við að afturkalla aðgangslykil',
  narrowTag: 'Takmarkaðar heimildir',
  narrowHint:
    'Þessi lykill hefur ekki allar heimildir og getur því ekki gert allt sem lykill getur. Ef hann á að hafa fullan aðgang skaltu búa til nýjan lykil og afturkalla þennan.',
  showRevoked: (count: number) => `Sýna óvirka lykla (${count})`,
  hideRevoked: 'Fela óvirka lykla',

  modal: {
    labelLabel: 'Heiti (valfrjálst)',
    labelHint:
      'Heitið er eingöngu til að greina lykla að — það hefur engin áhrif á aðgang.',
    expiresLabel: 'Gildistími',
    expiresHint:
      'Lykillinn hættir að virka að gildistíma loknum. Hægt er að afturkalla hann hvenær sem er.',
    expires90Days: '90 dagar',
    expires1Year: '1 ár',
    expires2Years: '2 ár',
    expiresNever: 'Ótímabundinn',
    createButton: 'Búa til lykil',
    createErrorToast: 'Villa við að búa til aðgangslykil',
    createdTitle: 'Lykillinn var búinn til',
    createdWarning:
      'Afritaðu lykilinn núna og geymdu hann á öruggum stað. Hann er ekki geymdur hjá Jafnréttisstofu og verður ekki sýndur aftur — ef hann týnist þarf að búa til nýjan.',
    copyButton: 'Afrita',
    copiedToast: 'Lykill afritaður',
    copyError:
      'Ekki tókst að afrita lykilinn. Veldu hann og afritaðu handvirkt áður en þú lokar glugganum.',
    doneButton: 'Ég hef afritað lykilinn',
    createdAfterCloseToast:
      'Lykill var búinn til eftir að glugganum var lokað og verður ekki sýndur. Afturkallaðu hann og búðu til nýjan.',
  },
}

export const delegationText = {
  heading: 'Þjónustuaðilar með umboð',
  intro:
    'Þjónustuaðili, til dæmis launakerfi eða bókhaldsstofa, getur aðeins skilað fyrir hönd fyrirtækisins á meðan það hefur veitt honum umboð. Umboð nær til allra skila og starfsmats fyrirtækisins. Það má afturkalla hvenær sem er og það tekur gildi samstundis.',
  grantButton: 'Veita umboð',
  empty: 'Enginn þjónustuaðili hefur umboð til að skila fyrir fyrirtækið.',
  loadError: 'Villa við að sækja umboð',
  grantedAt: 'Veitt',
  grantedBy: 'Veitt af',
  providerNationalId: 'Kennitala',
  narrowTag: 'Takmarkaðar heimildir',
  narrowHint:
    'Þetta umboð nær ekki til allra heimilda, svo þjónustuaðilinn getur ekki gert allt fyrir hönd fyrirtækisins. Ef hann á að hafa fullan aðgang skaltu afturkalla umboðið og veita það aftur.',

  revokeButton: 'Afturkalla umboð',
  revokeConfirmTitle: 'Afturkalla umboð?',
  revokeConfirmMessage: (provider: string) =>
    `${provider} getur samstundis ekki lengur skilað skýrslum eða lesið gögn fyrir hönd fyrirtækisins. Skýrslur sem þegar hafa borist halda sér. Hægt er að veita umboð aftur síðar.`,
  revokeConfirmButton: 'Afturkalla umboð',
  revokedToast: 'Umboð afturkallað',
  revokeErrorToast: 'Villa við að afturkalla umboð',

  modal: {
    title: 'Veita þjónustuaðila umboð',
    intro:
      'Veldu þjónustuaðila af lista Jafnréttisstofu yfir samþykkta þjónustuaðila.',
    providerLabel: 'Þjónustuaðili',
    noProviders:
      'Engir aðrir samþykktir þjónustuaðilar eru í boði. Þjónustuaðili sem fyrirtækið hefur þegar veitt umboð birtist ekki hér.',
    providersLoadError: 'Villa við að sækja lista yfir þjónustuaðila',
    handoverTitle: 'Þjónustuaðilinn sem þú velur fær að:',
    handoverItems: [
      'skila launagreiningu og jafnréttisáætlun fyrir hönd fyrirtækisins,',
      'lesa skýrslur fyrirtækisins og athugasemdir Jafnréttisstofu,',
      'skrá, breyta og eyða starfsmati fyrirtækisins.',
    ],
    summary: (provider: string, company: string) =>
      `Með því að staðfesta veitir þú ${provider} umboð til þessa fyrir hönd ${company} þar til umboðið er afturkallað.`,
    confirmButton: 'Staðfesta umboð',
    grantedToast: 'Umboð veitt',
    grantErrorToast: 'Villa við að veita umboð',
  },
}

export const apiKeyText = {
  heading: 'Aðgangslyklar fyrirtækisins',
  intro:
    'Aðgangslykill leyfir hugbúnaði fyrirtækisins sjálfs að skila skýrslum og vinna starfsmat beint hjá Jafnréttisstofu, án þjónustuaðila. Ef þjónustuaðili sér um skilin þarf fyrirtækið ekki lykil — veittu honum umboð í staðinn.',
  issueButton: 'Búa til aðgangslykil',
  empty: 'Fyrirtækið hefur engan aðgangslykil.',
  loadError: 'Villa við að sækja aðgangslykla',
  revokeConfirmTitle: 'Afturkalla aðgangslykil?',
  revokeConfirmMessage:
    'Lykillinn hættir samstundis að virka og það verður ekki tekið til baka. Hugbúnaður sem notar hann getur ekki skilað skýrslum fyrr en nýr lykill hefur verið settur upp.',

  modal: {
    title: 'Búa til aðgangslykil',
    labelPlaceholder: 'T.d. nafn launakerfisins',
  },
}

export const providerText = {
  heading: 'Lyklar þjónustuaðila',
  intro:
    'Jafnréttisstofa hefur samþykkt þetta fyrirtæki sem þjónustuaðila. Með lykli þjónustuaðila getur það skilað fyrir hönd þeirra fyrirtækja sem hafa veitt því umboð.',
  approvedAt: 'Samþykkt',
  rotationHint:
    'Til að skipta um lykil án rofs: búðu til nýjan, settu hann upp og afturkallaðu þann gamla.',
  issueButton: 'Búa til lykil þjónustuaðila',
  empty: 'Engir lyklar þjónustuaðila hafa verið búnir til.',
  loadError: 'Villa við að sækja lykla þjónustuaðila',
  revokeConfirmTitle: 'Afturkalla lykil þjónustuaðila?',
  revokeConfirmMessage:
    'Lykillinn hættir samstundis að virka fyrir öll fyrirtæki. Umboð fyrirtækjanna og aðrir lyklar halda sér.',
  modal: {
    title: 'Búa til lykil þjónustuaðila',
    labelPlaceholder: 'T.d. framleiðsluumhverfi',
  },
}
