import { JournalAdvertType } from '../dto/types/journal-advert-type.dto'
import { JournalAdvert } from '../dto/adverts/journal-advert.dto'
import { JournalAdvertCategory } from '../dto/categories/journal-category.dto'
import { JournalAdvertStatus } from '../dto/journal-constants.dto'
import { JournalAdvertDepartment } from '../dto/departments/journal-department.dto'
import { JournalPaging } from '../dto/journal-paging.dto'
import { ALL_MOCK_SIGNATURES } from './signatures.mock'

const JOURNAL_DEPARTMENT_A: JournalAdvertDepartment = {
  id: '3d918322-8e60-44ad-be5e-7485d0e45cdd',
  title: 'A deild',
  slug: 'a-deild',
}

const JOURNAL_DEPARTMENT_B: JournalAdvertDepartment = {
  id: '8ad799e0-93ac-4c69-9e5b-83d4b230da8a',
  title: 'B deild',
  slug: 'b-deild',
}

const JOURNAL_DEPARTMENT_C: JournalAdvertDepartment = {
  id: 'a9bb9a6a-61aa-42a4-8638-e9e5f5f2b676',
  title: 'C deild',
  slug: 'c-deild',
}

export const ALL_MOCK_JOURNAL_DEPARTMENTS = [
  JOURNAL_DEPARTMENT_A,
  JOURNAL_DEPARTMENT_B,
  JOURNAL_DEPARTMENT_C,
]

const DEPT_A_AUGLYSING: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be0',
  title: 'AUGLÝSING',
  slug: 'auglysing',
  department: JOURNAL_DEPARTMENT_A,
}

const DEPT_A_FJARAUKALOG: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be1',
  title: 'FJÁRAUKALÖG',
  slug: 'fjaraukalog',
  department: JOURNAL_DEPARTMENT_A,
}

const DEPT_A_FJARLOG: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be2',
  title: 'FJÁRLOG',
  slug: 'fjarlog',
  department: JOURNAL_DEPARTMENT_A,
}

const DEPT_A_FORSETABREF: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be3',
  title: 'FORSETABRÉF',
  slug: 'forsetabref',
  department: JOURNAL_DEPARTMENT_A,
}

const DEPT_A_FORSETAURSKURDUR: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be4',
  title: 'FORSETAÚRSKURÐUR',
  slug: 'forsetaurskurdur',
  department: JOURNAL_DEPARTMENT_A,
}

const DEPT_A_LOG: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be5',
  title: 'LÖG',
  slug: 'log',
  department: JOURNAL_DEPARTMENT_A,
}

const DEPT_A_LOKAFJARLOG: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be6',
  title: 'LOKAFJÁRLÖG',
  slug: 'lokafjarlog',
  department: JOURNAL_DEPARTMENT_A,
}

export const DEPT_A_TYPES = [
  DEPT_A_AUGLYSING,
  DEPT_A_FJARAUKALOG,
  DEPT_A_FJARLOG,
  DEPT_A_FORSETABREF,
  DEPT_A_FORSETAURSKURDUR,
  DEPT_A_LOG,
  DEPT_A_LOKAFJARLOG,
]

export const DEPT_B_AUGLYSING: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be7',
  title: 'AUGLÝSING',
  slug: 'auglysing',
  department: JOURNAL_DEPARTMENT_B,
}

const DEPT_B_GJALDSKRA: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be8',
  title: 'GJALDSKRÁ',
  slug: 'gjaldskra',
  department: JOURNAL_DEPARTMENT_B,
}

const DEPT_B_ARDSKRA: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be9',
  title: 'ARÐSKRÁ',
  slug: 'ardskra',
  department: JOURNAL_DEPARTMENT_B,
}

const DEPT_B_REGLUGERD: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402bea',
  title: 'REGULUGERÐ',
  slug: 'reglugerd',
  department: JOURNAL_DEPARTMENT_B,
}

const DEPT_B_SKIPULAGSSKRA: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402beb',
  title: 'SKIPULAGSSKRÁ',
  slug: 'skipulagsskra',
  department: JOURNAL_DEPARTMENT_B,
}

const DEPT_B_SAMTHYKKT: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402bec',
  title: 'SAMÞYKKT',
  slug: 'samthykkt',
  department: JOURNAL_DEPARTMENT_B,
}

const DEPT_B_REGLUR: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402bed',
  title: 'REGLUR',
  slug: 'reglur',
  department: JOURNAL_DEPARTMENT_B,
}

/*
Missing:
BÆJANÖFN O.FL.
FJALLSKILASAMÞYKKT
HAFNARREGLUGERÐ
HEIÐURSMERKI FÁLKAORÐUNNAR
LÖGREGLUSAMÞYKKT
REIKNINGUR
SIÐAREGLUR
STARFSREGLUR
*/

export const DEPT_B_TYPES = [
  DEPT_B_ARDSKRA,
  DEPT_B_AUGLYSING,
  DEPT_B_GJALDSKRA,
  DEPT_B_REGLUGERD,
  DEPT_B_REGLUR,
  DEPT_B_SAMTHYKKT,
  DEPT_B_SKIPULAGSSKRA,
]

export const DEPT_C_AUGLYSING: JournalAdvertType = {
  id: 'faabd8a8-b327-4084-94bc-6001b0402be8',
  title: 'AUGLÝSING',
  slug: 'auglysing',
  department: JOURNAL_DEPARTMENT_C,
}

export const DEPT_C_TYPES = [DEPT_C_AUGLYSING]

export const ALL_MOCK_JOURNAL_TYPES = [
  ...DEPT_A_TYPES,
  ...DEPT_B_TYPES,
  ...DEPT_C_TYPES,
]

const MOCK_CATEGORY_GAELUDYR: JournalAdvertCategory = {
  id: 'e6bb8e18-40f7-4b30-be21-581ec5da5c92',
  title: 'Gæludýr',
  slug: 'gaeludyr',
}

const MOCK_CATEGORY_SKIPULAGSMAL: JournalAdvertCategory = {
  id: 'b113e386-bdf1-444f-a2ed-72807038cff1',
  title: 'Skipulagsmál',
  slug: 'skipulagsmal',
}

const MOCK_CATEGORY_REYKJAVIK: JournalAdvertCategory = {
  id: '62cb4baf-5c3c-4664-88aa-d90b5b3b3b2e',
  title: 'Reykjavík',
  slug: 'reykjavik',
}

export const ALL_MOCK_JOURNAL_CATEGORIES = [
  MOCK_CATEGORY_GAELUDYR,
  MOCK_CATEGORY_SKIPULAGSMAL,
  MOCK_CATEGORY_REYKJAVIK,
]

export const emptyAdvert: JournalAdvert = {
  id: '',
  department: JOURNAL_DEPARTMENT_B,
  type: {
    id: '',
    title: '',
    slug: '',
    department: new JournalAdvertDepartment(),
  },
  subject: '',
  title: '',
  status: JournalAdvertStatus.Active,
  publicationNumber: {
    number: 0,
    year: 0,
    full: '',
  },
  createdDate: '',
  updatedDate: '',
  signatureDate: null,
  publicationDate: null,
  categories: [],
  involvedParty: {
    id: '',
    title: '',
    slug: '',
  },
  document: {
    isLegacy: false,
    html: null,
    pdfUrl: null,
  },
  signature: null,
}

export const ADVERT_B_866_2006: JournalAdvert = {
  id: 'bcbefaf4-c021-4b63-877b-001dde880052',
  department: JOURNAL_DEPARTMENT_B,
  type: DEPT_B_AUGLYSING,
  subject: 'um breytingar á deiliskipulagsáætlunum í Reykjavík.',
  title: 'AUGLÝSING um breytingar á deiliskipulagsáætlunum í Reykjavík.',
  status: JournalAdvertStatus.Active,
  publicationNumber: {
    number: 866,
    year: 2006,
    full: '866/2006',
  },
  createdDate: '2006-10-17 15:44:05.000',
  updatedDate: '2006-10-19 15:11:39.000',
  signatureDate: '2006-10-17 00:00:00.0000',
  publicationDate: '2006-10-19 00:00:00.000',
  categories: [MOCK_CATEGORY_SKIPULAGSMAL, MOCK_CATEGORY_REYKJAVIK],
  involvedParty: {
    id: 'cdbbd6ba-eac0-4e45-be08-b01063bd26c0',
    title: 'Skipulags- og byggingarsvið Reykjavíkur',
    slug: 'skipulags-og-byggingarsvid-reykjavikur',
  },
  document: {
    isLegacy: true,
    html: `<link rel="stylesheet" type="text/css" href="print.css" media="screen" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes"> <link rel="stylesheet" type="text/css" href="../Styles/Printing.css" media="screen" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes"> <TABLE width="100%" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">   <TR class="advertText">     <TD colspan="2">           Sé munur á uppsetningu texta hér að neðan og í PDF skjali gildir PDF skjalið.<br><a href="PdfVersions.aspx?recordId=bcbefaf4-c021-4b63-877b-001dde880052"><img src="Images/pdf.gif" border="0"> 866/2006</a><br><br></TD>   </TR>   <TR class="advertSubSerial">     <TD align="left" style="width:260">           Nr. 866/2006</TD>     <TD align="right" style="width:260">17. október 2006</TD>   </TR> </TABLE> <TABLE xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">   <TR class="advertType" align="center">     <TD><b>AUGLÝSING</b></TD>   </TR>   <TR class="advertType" align="center">     <TD><b>um breytingar á deiliskipulagsáætlunum í Reykjavík.</b></TD>   </TR>   <TR class="advertText">     <TD><html><meta name="Generator" content="GoPro.net"><body><META content=GoPro.net name=Generator><META content=GoPro.net name=Generator><META content=GoPro.net name=Generator><I><P align=justify>Austurberg 5.<BR></I>Í samræmi við skipulags- og byggingarlög, samþykkti borgarráð Reykjavíkurborgar þann 27. júlí 2006 breytingu á deiliskipulagi fyrir Breiðholt III, vegna lóðarinnar að Austurbergi 5.<BR>Uppdrættir hafa hlotið þá meðferð sem skipulags- og byggingarlög mæla fyrir um.<BR>Breytingin öðlast þegar gildi.</P><I><P align=justify>Katrínarlind 1-7.<BR></I>Í samræmi við skipulags- og byggingarlög, samþykkti skipulagsráð Reykjavíkurborgar þann 20. september 2006 breytingu á deiliskipulagi fyrir Grafarholt vegna lóðanna að Katrínarlind 1-7.<BR>Uppdrættir hafa hlotið þá meðferð sem skipulags- og byggingarlög mæla fyrir um.<BR>Breytingin öðlast þegar gildi.</P><I><P align=justify>Klettagarðar 13.<BR></I>Í samræmi við skipulags- og byggingarlög, samþykkti skipulagsráð Reykjavíkurborgar þann 23. ágúst 2006 breytingu á deiliskipulagi fyrir Klettasvæði vegna Klettagarða 13.<BR>Uppdrættir hafa hlotið þá meðferð sem skipulags- og byggingarlög mæla fyrir um.<BR>Breytingin öðlast þegar gildi.</P><I><P align=justify>Álfsnes, Kjalarnesi.<BR></I>Í samræmi við skipulags- og byggingarlög, samþykkti skipulagsráð Reykjavíkurborgar þann 9. mars 2006 breytingu á deiliskipulagi fyrir Kjalarnes vegna urðunarstaðar Sorpu í Álfsnesi.<BR>Uppdrættir hafa hlotið þá meðferð sem skipulags- og byggingarlög mæla fyrir um.<BR>Breytingin öðlast þegar gildi.</P><I><P align=center>Skipulagsfulltrúi Reykjavíkurborgar, 17. október 2006.</P></I><B><P align=center>Helga Bragadóttir.</P></B></body></html></TD>   </TR> </TABLE> <TABLE width="100%" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">   <TR class="advertSubSerial">     <TD align="center" nowrap colspan="2" style="width:520"><b>B deild - Útgáfud.: 19. október 2006</b></TD>   </TR>   <TR class="advertText">     <TD>                                                  </TD>   </TR> </TABLE>`,
    pdfUrl: null,
  },
  signature:
    ALL_MOCK_SIGNATURES.find(
      (s) => s.advertId === 'bcbefaf4-c021-4b63-877b-001dde880052',
    ) || null,
}

export const ADVERT_B_1278_2023: JournalAdvert = {
  id: '749f1eff-236d-4c67-a4cc-eb7a7bbd373f',
  department: JOURNAL_DEPARTMENT_B,
  type: DEPT_B_GJALDSKRA,
  subject: 'fyrir hundahald í Reykjavíkurborg.',
  title: 'GJALDSKRÁ fyrir hundahald í Reykjavíkurborg.',
  status: JournalAdvertStatus.Active,
  publicationNumber: {
    number: 1278,
    year: 2023,
    full: '1278/2023',
  },
  createdDate: '2023-11-16 13:45:44.617',
  updatedDate: '',
  signatureDate: '2023-11-15 00:00:00.000',
  publicationDate: '2023-11-29 00:00:00.000',
  categories: [MOCK_CATEGORY_GAELUDYR, MOCK_CATEGORY_REYKJAVIK],
  involvedParty: {
    id: 'ad08ee8a-56c8-4360-a1f6-6a0f6122e0b6',
    title: 'Umhverfis- og skipulagssvið Reykjavíkurborgar',
    slug: 'umhverfis-og-skipulagssvid-reykjavikurborgar',
  },
  document: {
    isLegacy: true,
    html: `<link rel="stylesheet" type="text/css" href="print.css" media="screen" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes"> <link rel="stylesheet" type="text/css" href="../Styles/Printing.css" media="screen" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes"> <TABLE width="100%" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">   <TR class="advertText">     <TD colspan="2">           Sé munur á uppsetningu texta hér að neðan og í PDF skjali gildir PDF skjalið.<br><a href="PdfVersions.aspx?recordId=749f1eff-236d-4c67-a4cc-eb7a7bbd373f"><img src="Images/pdf.gif" border="0"> 1278/2023</a><br><br></TD>   </TR>   <TR class="advertText">     <TD align="left" style="width:260">           Nr. 1278/2023</TD>     <TD align="right" style="width:260">15. nóvember 2023</TD>   </TR> </TABLE> <TABLE xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">   <TR class="advertType" align="center">     <TD class="advertTD" colspan="2"><br>GJALDSKRÁ</TD>   </TR>   <TR class="advertType2" align="center" colspan="2">     <TD class="advertTD" colspan="2">fyrir hundahald í Reykjavíkurborg.</TD>   </TR>   <TR class="advertText">     <TD class="advertTD" colspan="2"><br><p style="text-align: center !important;">1. gr.</p> <p style="text-align: justify;">Af hundum í Reykjavíkurborg skal Dýraþjónusta Reykjavíkur innheimta gjöld samkvæmt gjald­skrá þessari, sem ætlað er að standi undir kostnaði við framkvæmd samþykktar um hundahald í Reykjavíkur­borg nr. 355/2022.</p> <p> </p> <p style="text-align: center !important;">2. gr.</p> <p style="text-align: justify;">Af hundum í Reykjavíkurborg skal innheimta árlegt þjónustu- og eftirlitsgjald, hundagjald, sam­kvæmt samþykkt um hundahald í Reykjavíkurborg árið eftir að hundur er skráður í fyrsta sinn og síðan árlega eftir það. Ekkert gjald er innheimt við skráningu hunds.</p> <table style="margin-left: 15px;" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td valign="top" width="302">Árlegt hundagjald</td> <td style="width: 57px;" align="center" valign="top">kr.</td> <td style="width: 66px;" align="right" valign="top">17.200</td> </tr> <tr> <td valign="top" width="302">Skráningargjald</td> <td style="width: 57px;" align="center" valign="top">kr.</td> <td style="width: 66px;" align="right" valign="top">0</td> </tr> </tbody> </table> <p style="text-align: justify;">Skrá skal alla hunda í Reykjavíkurborg, einnig þá sem undanþegnir eru árlegu hundagjaldi sam­kvæmt samþykkt um hundahald í Reykjavíkurborg.</p> <p style="text-align: justify;"> </p> <p style="text-align: center !important;">3. gr.</p> <p style="text-align: justify;">Heimilt er að veita allt að 30% afslátt af árlegu gjaldi hafi viðkomandi hundaeigandi sótt nám­skeið um hundahald sem viðurkennt er af Dýraþjónustu Reykjavíkur.</p> <p style="text-align: justify;"> </p> <p style="text-align: center !important;">4. gr.</p> <p style="text-align: justify;">Við afhendingu handsamaðs óskráðs hunds ber að innheimta kr. 37.230 handsömunargjald. Að auki skal eigandi greiða þann kostnað sem fellur til vegna dvalar eða geymslu viðkomandi hunds. Við afhendingu handsamaðs hunds, sem skráður er í Reykjavíkurborg eða hjá öðru sveitarfélagi, skal einungis innheimtur sá kostnaður sem fallið hefur til vegna dvalar og geymslu viðkomandi hunds. Hafi skráður hundur verið handsamaður þrisvar sinnum eða oftar skal eigandi þó greiða hand­sömunar­gjald sem og kostnað vegna dvalar og geymslu viðkomandi hunds.</p> <p style="text-align: justify;"> </p> <p style="text-align: center !important;">5. gr.</p> <p style="text-align: justify;">Gjalddagi samkvæmt 2. og 3. gr. er 1. mars og eindagi 1. maí ár hvert. Dráttarvextir reiknast frá gjalddaga séu gjöldin ekki greidd á eindaga. Um innheimtu gjalda fer samkvæmt 59. gr. laga nr. 7/1998 um hollustuhætti og mengunarvarnir.</p> <p style="text-align: justify;"> </p> <p style="text-align: center !important;">6. gr.</p> <p style="text-align: justify;">Gjaldskrá þessi sem samin er og samþykkt af borgarstjórn Reykjavíkur 7. nóvember 2023, með heimild í 5. mgr. 59. gr. laga nr. 7/1998 um hollustuhætti og mengunarvarnir, með síðari breyt­ingum og 24. gr. laga nr. 55/2013 um velferð dýra staðfestist hér með og öðlast gildi 1. janúar 2024. Um leið fellur úr gildi gjaldskrá sama efnis nr. 999/2023.</p> <p style="text-align: justify;"> </p> <p style="text-align: center !important; font-style: italic !important;">Borgarstjórinn í Reykjavík, 15. nóvember 2023.</p> <p> </p> <p style="text-align: center !important; font-weight: bold !important;">Dagur B. Eggertsson.</p><br></TD>   </TR> </TABLE> <TABLE width="100%" xmlns:ms="urn:schemas-microsoft-com:xslt" xmlns:dt="urn:schemas-microsoft-com:datatypes">   <TR class="advertText">     <TD align="center" nowrap colspan="2" style="width:520"><b>B deild - Útgáfud.: 29. nóvember 2023</b></TD>   </TR>   <TR class="advertText">     <TD>                                                  </TD>   </TR> </TABLE>`,
    pdfUrl: null,
  },
  signature:
    ALL_MOCK_SIGNATURES.find(
      (s) => s.advertId === '749f1eff-236d-4c67-a4cc-eb7a7bbd373f',
    ) || null,
}

export const MOCK_PAGING_SINGLE_PAGE: JournalPaging = {
  page: 1,
  pageSize: 10,
  totalPages: 1,
  totalItems: 0,
  nextPage: 0,
  previousPage: null,
  hasNextPage: false,
  hasPreviousPage: false,
}
