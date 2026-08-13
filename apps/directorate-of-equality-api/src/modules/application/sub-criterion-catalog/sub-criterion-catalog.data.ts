/**
 * Jafnréttisstofa's catalog of standard sub-criteria (undirviðmið).
 *
 * GENERATED FILE — do not edit by hand. Regenerate after updating the
 * workbook:
 *
 *   node scripts/refresh-doe-sub-criterion-catalog.js
 *
 * Source: the `Undirviðmiðalisti (Lýsigögn)` sheet of `template.xlsx`, which
 * is what feeds the Undirviðmið sheet's dropdown inside the workbook. The
 * application portal offers the same list, so the catalog is lifted out of
 * the xlsx and shipped as data rather than re-parsed at request time.
 *
 * Entries are reference material, not a closed set: an employer may pick one
 * and overwrite its wording, or register a sub-criterion as free text. The
 * personal entries with `numSteps: null` deliberately ship with step 1 only
 * — the employer authors the remaining steps.
 */

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'

export type SubCriterionCatalogEntry = {
  /** Which top-level criterion this sub-criterion belongs under. */
  criterionType: ReportCriterionTypeEnum
  /** Icelandic Yfirviðmið label as it appears in the workbook. */
  parentTitle: string
  title: string
  description: string
  /** Fjöldi þrepa, or `null` when the employer decides it. */
  numSteps: number | null
  /** Step descriptions, ordered from step 1. */
  steps: string[]
}

/**
 * Generic step wording (`Almennur þrepakvarði`) the workbook suggests for
 * sub-criteria that carry no step descriptions of their own. Indexed from
 * step 1; each entry is a comma-separated list of interchangeable phrasings.
 */
export const SUB_CRITERION_GENERAL_SCALE: readonly string[] = [
  'Aldrei, engin, takmörkuð, mjög lítið, mjög sjaldan, hóflegt, sjaldgæft',
  'Sjaldan, fremur lítið, öðru hverju, stundum, nokkuð',
  'Reglulega, í meðallagi, talsvert',
  'Fremur mikið, nokkuð oft, oft, umtalsvert, mikil',
  'Mjög mikið, mjög oft, viðvarandi',
]

export const SUB_CRITERION_CATALOG: readonly SubCriterionCatalogEntry[] = [
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Formleg menntun',
    description:
      'Starf krefst tiltekinnar formlegrar menntunar. Hér er metin sú fræðilega og verklega menntun sem starfið krefst frá viðurkenndri menntastofnun.',
    numSteps: 5,
    steps: [
      'Krafist er grunnskólaprófs eða engrar formlegrar menntunar',
      'Próf frá styttri starfsnámsbrautum, félagsliði, heilbrigðisritari, málmsuða og annað stigskipt nám.',
      'Stúdentspróf, iðnnám, fagmenntun, viðbótarnám (meirapróf, löggiltur bókari).',
      'Grunnám á háskólastigi, diplómanám eða BS/BA próf.',
      'Framhaldsnám á háskólastigi, MA/MS/Med próf/MPA/MBA eða viðbótarmenntun. (Doktorspróf fer á hærra þrep og ramminn teygður sem því nemur).',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Starfsreynsla',
    description: 'Starf krefst tiltekinnar starfsreynslu.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki starfsreynslu. Starfsþjálfun á vinnustað nægir til að öðlast þá þekkingu sem krafist er í starfi.',
      'Starf krefst nokkurar almennrar starfsreynslu (1-3 ár).',
      'Starf krefst lengri almennrar starfsreynslu (3 ár eða meira) eða sérhæfðrar starfsreynslu (1-5 ár) innan fag- eða starfssviðsins.',
      'Starf krefst langrar sérhæfðrar starfsreynslu (5-8 ár) innan fag- eða starfssviðsins.',
      'Starf krefst langrar sérhæfðrar starfsreynslu á tilteknu sérsviði (8 ár eða meira). Yfirgripsmikillar þekkingar og reynslu af viðkomandi starfi eða stjórnunarreynslu á viðkomandi sviði krafist.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Starfsþjálfun á vinnustað/ starfsaldur',
    description: 'Starf krefst starfsreynslu innan vinnustaðar.',
    numSteps: 5,
    steps: [
      'Starf krefst ekki starfsreynslu innan vinnustaðar. Starfsþjálfun á vinnustað nægir til að öðlast þá þekkingu sem krafist er í starfi.',
      'Starf krefst nokkurrar starfsreynslu innan vinnustaðar (1-3 ár).',
      'Starf krefst nokkuð mikillar starfsreynslu innan vinnustaðar (2-5 ár).',
      'Starf krefst mikillar starfsreynslu innan vinnustaðar (5-8 ár).',
      'Starf krefst mjög mikillar starfsreynslu innan vinnustaðar (8 ár eða meira) og getu til að leiðbeina.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Hugræn færni',
    description:
      'Starf krefst færni til að þróa, greina og leysa vandamál og leggja mat á viðfangsefni hverju sinni. Krefst einnig færni í skipulags- eða áætlunargerð og að rýna til gagns.',
    numSteps: 5,
    steps: [
      'Starf felur í sér úrlausnir daglegra (endurtekinna) verkefna. Almenn grunnþekking sem nýtist í starfi.',
      'Starf krefst færni í að afla, túlka og meta upplýsingar til að leysa vandamál. Þekking á staðreyndum, reglum, verkferlum og almennum hugtökum.',
      'Starf krefst færni í að afla, greina, skapa eða þróa lausnir og túlka sérfræðilegar upplýsingar, ásamt færni í að móta áætlanir í afmörkuðum verkefnum. Sérhæfð og hagnýt þekking.',
      'Starf krefst færni í að greina, skapa eða þróa lausnir og túlka flóknar, sérfræðilegar upplýsingar, ásamt færni í að móta áætlanir í meira en ár. Sérhæfð og fagleg þekking.',
      'Starf krefst færni í að greina, skapa eða þróa lausnir og túlka sérlega flóknar sérfræðilegar upplýsingar, ásamt færni í að móta áætlanir til lengri tíma. Þátttaka í mótun þekkingarsviðs og skilningur á samspili þekkingar, starfs og ytra umhverfis.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Félagsleg færni',
    description:
      'Starf krefst færni og getu til að vinna með öðrum á árangursríkan hátt og setja sig í spor annarra.',
    numSteps: 4,
    steps: [
      'Starf krefst almennrar færni til að vinna með öðrum og vinna eftir samskiptareglum vinnustaðar.',
      'Starf krefst stundum samskipta við vinnufélaga eða viðskiptavini og getu til að vinna sem hluti af heild.',
      'Starf krefst mjög mikillar lipurðar í samskiptum og mjög náins samstarfs við aðra. Starfsmaður sýnir sjálfstæði, sveigjanleika og getur aðlagað tjáskipti að ólíkum hópum. Getur stutt og hvatt aðra og eflt liðsheild.',
      'Starf krefst viðvarandi samstarfs og samskipti við ólíka og marga aðila, í innra og ytra umhverfi.  Færni til að vinna með öðrum, að lausn mála, leysa ágreining, þjálfa og þróa hópavinnuaðferðir.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Líkamleg færni (eða lipurð og handlagni)',
    description:
      'Starf krefst sérstakrar líkamlegrar færni umfram það sem venjulegt er. Átt er við t.d. Líkamlegan styrk, handlagni, fingrafimi, lipurð, samhæfingu augna og handa og samhæfingu skynfæra.',
    numSteps: 5,
    steps: [
      'Starf krefst hóflegrar líkamlegrar færni, þó ekki umfram það sem eðlilegt getur talist.',
      'Starf krefst nokkurrar líkamlegrar færni.',
      'Starf krefst talsverðrar líkamlegrar færni.',
      'Starf krefst umtalsverðrar líkamlegrar færni.',
      'Starfið krefst mjög mikillar og viðvarandi líkamlegrar færni.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Upplýsingatækni',
    description:
      'Starf krefst færni til að nota viðeigandi tölvutækni, tæki og forrit við öflun upplýsinga og þekkingar, upplýsinga- og gagnavinnslu og í samskiptum.',
    numSteps: 5,
    steps: [
      'Starf krefst þess að starfsmaður geti notað upplýsingatækni í einföldum verkefnum í samræmi við fyrirmæli.',
      'Starfið krefst þess að starfsmaður noti upplýsingatækni á hagnýtan og viðeigandi hátt. Gerð er krafa um að starfsmaður geti t.d. beitt einföldum aðgerðum í þeim forritum sem tengjast starfinu og notað ritvinnslu, Netið, innra net, sniðmát og tölvupóst í starfi sínu.',
      'Starf krefst þess að starfsmaður noti upplýsingatækni til að vinna úr upplýsingum og noti þær við nýjar aðstæður. Gerð er krafa um að starfsmaður geti t.d. unnið í algengum forritum, sérhæfðum gagnagrunnum, kerfum og forritum sem nauðsynleg eru til að sinna starfinu. Geta til að velja rafræn verkfæri eftir eðli verkefna.',
      'Starf krefst þess að starfsmaður skilji og noti fjölþætta upplýsingatækni til að draga eigin ályktanir og leysa fjölbreytt verkefni. Gerð er krafa um að starfsmaður geti t.d. unnið í öllum helstu forritum, sérhæfðum gagnagrunnum, kerfum og forritum til að finna lausnir og bæta árangur. Geta til að nota flóknar aðgerðir  til árangurs og leiðbeina öðrum.',
      'Starf krefst þess að starfsmaður hafi yfirgripsmikla þekkingu á upplýsingatækni og geti notað hana í nýjum og flóknum aðstæðum. Starfsmaður þarf einnig að geta leiðbeint öðrum sérfræðingum og tileinkað sér nýjustu upplýsingatækni sem er fyrirséð að muni gagnast til að ná markmiðum. Hefur umsjón með kerfisstillingum og tekur þátt í þróun og aðlögun hugbúnaðar að starfseminni og nýjum kröfum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Upplýsingalæsi',
    description:
      'Starf krefst færni til að vinna með fjölbreyttar upplýsingar og setja skilmerkilega fram s.s. með því að finna efni, greina, meta, vista, miðla og nýta.',
    numSteps: 3,
    steps: [
      'Starf krefst þess að starfsmaður afli afmarkaðra upplýsinga sem þörf er á hverju sinni og geti nýtt í samræmi við verklag og fyrirmæli.',
      'Starf krefst þess að starfsmaður noti viðeigandi tegundir heimilda, fyrirmæla eða verkferla (munnlegar, bækur, skjöl, net, tímarit) til að afla upplýsinga og vinna úr þeim.',
      'Starf krefst þess að starfsmaður afli fjölbreyttra upplýsinga með viðeigandi heimildum og á sjálfstæðan hátt og vinni úr þeim í samræmi við fyrirmæli og faglegan grunn.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Tölvunotkun',
    description:
      'Starf krefst getu til að nýta þau forrit, gagnagrunna og kerfi sem nauðsynleg eru til að sinna starfinu.',
    numSteps: 5,
    steps: [
      'Starf krefst mjög lítillar eða engrar tölvunotkunar. Dæmi um kröfur er að fylgjast með tölvupósti og upplýsingum á innra neti og skrá viðveru eða vaktir.',
      'Starf krefst almennrar færni í algengum forritum, t.d. fyrir ritvinnslu, töflureikni og tölvupóst. Starfsmaður tileinkar sér þá tölvunotkun sem starfið krefst, t.d. beitir einföldum aðgerðum í forritum sem tengjast starfinu.',
      'Starf krefst nokkurar færni í algengum forritum, t.d. fyrir ritvinnslu, töflureikni, tölvupóst og glærugerð. Starfsmaður tileinkar sér þá færni sem starfið krefst, t.d. beitir sérhæfðum aðgerðum eins og að leita í gagnagrunnum og flytja gögn  milli algengra forrita.',
      'Starf krefst umtalsverðrar færni í algengum og sérhæfðum forritum og kerfum ásamt því að meta virkni.',
      'Starfið krefst mjög mikillar færni í algengum og sérhæfðum forritum og kerfum ásamt því að koma með tillögur að umbótum og innsetningu gagna.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Íslenska',
    description:
      'Starf krefst þekkingar, skilnings og notkunar á íslensku máli.',
    numSteps: 5,
    steps: [
      'Starf krefst almennrar þekkingar, skilnings og notkunar á íslensku máli, ekki umfram það sem eðlilegt getur talist.',
      'Starf krefst nokkuð góðrar þekkingu, skilnings og notkunar á íslensku máli.',
      'Starf krefst góðrar þekkingu, skilnings og notkunar á íslensku máli.',
      'Starf krefst mjög góðrar þekkingu, skilnings og notkunar á íslensku máli.',
      'Starf krefst afburða þekkingar, skilnings og notkunar á íslensku máli.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Erlend tungumál',
    description:
      'Starf krefst þekkingar, skilnings og notkunar á erlendu tungumáli.',
    numSteps: 5,
    steps: [
      'Starf krefst almennrar þekkingar, skilnings og notkunar á erlendu máli, ekki umfram það sem eðlilegt getur talist.',
      'Starf krefst nokkuð góðrar þekkingu, skilnings og notkunar á erlendu máli.',
      'Starf krefst góðrar þekkingu, skilnings og notkunar á erlendu máli.',
      'Starf krefst mjög góðrar þekkingu, skilnings og notkunar á erlendu máli.',
      'Starf krefst afburða þekkingar, skilnings og notkunar á erlendu máli.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Talnalæsi',
    description:
      'Starf krefst færni til að vinna með tölur og beita viðeigandi reikniaðgerðum.',
    numSteps: 5,
    steps: [
      'Starf krefst skilnings á einföldum tölulegum upplýsingum og færni til að reikna einföld dæmi.',
      'Starf krefst færni til að gera útreikninga fyrir tiltekin verkefni og til að setja tölulegar upplýsingar fram á réttan hátt.',
      'Starf krefst þess að starfsmaður geti notað töluleg gögn til að rökstyðja og miðla upplýsingum.',
      'Starf krefst mikillar færni til að nota töluleg gögn í fjölbreyttum verkefnum. Meðhöndlun tölulegra upplýsinga er mikilvægur partur af starfinu.',
      'Starf krefst mjög mikillar færni og getu til að nota töluleg gögn í mjög fjölbreyttum verkefnum. Meðhöndlun mjög flókinna tölulegra upplýsinga er mjög viðamikill þáttur í starfinu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Lausn ágreinings',
    description:
      'Starfið krefst þess að starfsmaður komi í veg fyrir, spái fyrir um og leysi ágreining eða togstreitu af völdum innri eða ytri samskipta í vinnunni. Innri samskipti vísa til samskipta milli fólks sem starfa á sama vinnustað, óháð stöðu þeirra. Ytri samskipti vísa til samskipta starfsmanna við birgja, viðskiptavini eða aðra sem ekki starfa á vinnustaðnum.',
    numSteps: 5,
    steps: [
      'Starf krefst takmarkaðrar eða engrar hæfni í að leysa ágreining eða togstreitu. Þurfi starfsmaður að koma að lausn ágreinings telst það til undantekninga.',
      'Starf krefst nokkurrar hæfni í lausn ágreinings eða togstreitu af völdum innri samskipta.',
      'Starf krefst talsverðrar hæfni í lausn ágreinings eða togstreitu af völdum ytri samskipta. Gert er ráð fyrir að lausn ágreinings sé fyrirsjáanlegur hluti starfsins.',
      'Starf krefst mikillar hæfni í lausn ágreinings og togstreitu, bæði af völdum innri og ytri samskipta. Gert er rtáð fyrir að lausn ágreinings  sé reglulegur og fyrirsjáanlegur hluti starfsins.',
      'Starfið krefst mjög mikillar hæfni í lausn ágreinings eða togstreitu, bæði af völdum innri og ytri samskipta. Gert er ráð fyrir að lausn ágreinings sé óhjákvæmilegur hluti starfsins.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Sjálfstæði',
    description:
      'Starf krefst færni til að grípa til sjálfstæðra aðgerða, skipuleggja og ljúka verkefnum í tíma, fylgja viðeigandi ferlum og nýta þau úrræði sem standa til boða.',
    numSteps: 5,
    steps: [
      'Starf krefst takmarkaðs sjálfstæðis. Starfið er unnið undir daglegri verkstjórn eða fyrirmælum og starfsmaður hefur ekkert eða lítið svigrúm til að breyta vinnuskipulagi.',
      'Starf krefst þess að starfsmaður vinni sjálfstætt eftir skipulagi vinnustaðar og ákveðnu tímaplani en leysir úr daglegum málum og forgangsraðar þeim eftir þörfum. Vandamálum er vísað til yfirmanns.',
      'Starf krefst þess að starfsmaður vinni töluvert sjálfstætt innan viðurkennds starfsramma en geti forgangsraðað verkefnum. Starfsmaður þarf reglulega að taka sjálfstæðar ákvarðanir en hefur samráð við yfirmann vegna stærri mála.',
      'Starf krefst mikils sjálfstæðis. Starfsmaður hefur umboð og vald til ákvarðanatöku gagnvart margskonar starfsemi. Starfsmaður nýtir þau úrræði sem standa til boða og er fær um að meta verðmæti verkefna. Starfsmaður hefur takmarkaðan aðgang að hærra settum yfirmönnum.',
      'Starf krefst mjög mikils og viðvarandi sjálfstæðis. Starfið lýtur lágmarksstjórnun og starfsmaður hefur skilgreint vald til ákvarðanatöku á víðtæku sviði.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Frumkvæði',
    description:
      'Starf krefst frumkvæðis. Frumkvæði í starfi felur í sér að starfsmaður taki af skarið, leiti eftir og beri kennsl á tækifæri fyrir vinnustaðinn. Einnig að starfsmaður komi í veg fyrir áhrif mögulegra vandamála með því að sjá þau fyrir og vera undirbúinn.',
    numSteps: 5,
    steps: [
      'Starf krefst þess ekki að starfsmaður sýni sérstakt frumkvæði nema þar sem lítil eða engin hætta er á mistökum.',
      'Starf krefst þess að starfsmaður sýni frumkvæði öðru hvoru en fylgi að öðru leyti verkferlum. Leitar leiðsagnar þegar vafaatriði koma upp.',
      'Starf krefst þess að starfsmaður sýni töluvert frumkvæði í starfi og hafi svigrúm til sjálfstæðra vinnubragða og túlkunar og forgangsröðunar.',
      'Starf krefst þess að starfsmaður sýni mikið frumkvæði og sé sjálfstæður í vinnubrögðum. Geti unnið og þróað hugmyndir og verklag.',
      'Starf krefst þess að starfsmaður sýni mjög mikið frumkvæði í starfi og í þróun starfsvettvangs, umbótavinnu og uppsetningu verkefna. Leiðbeinir og leiðir vinnu. Sinnir nýsköpun markvisst og mati á árangri.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Samskiptafærni',
    description:
      'Starf krefst færni í munnlegum og/eða skriflegum samskiptum. Taka þarf tillit til eðli samskiptanna.',
    numSteps: 4,
    steps: [
      'Starf krefst almennrar færni til að skiptast á almennum upplýsingum  við starfsfélaga og viðskiptavini.',
      'Starf krefst nokkurrar færni til að skiptast á almennum upplýsingum sem tengjast daglegum störfum við starfsfélaga og einstaka sinnum við t.d. almenning. Starf krefst þess að starfsmaður geti sýnt nærgætni þegar það á við.',
      'Starf krefst talsverðrar færni í samskiptum, sem er stór hluti starfsins. Þess er krafist að starfsmenn hafi einhvers konar þjálfun eða reynslu af slíkum samskiptum.',
      'Starf krefst mjög mikillar færni til að takast á við viðvarandi flókin eða erfið samskipti, sem er meginþáttur starfsins. Starf gæti krafist náms og/eða reynslu á sviði samskipta.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.COMPETENCE,
    parentTitle: 'Hæfni',
    title: 'Öryggisvitund',
    description:
      'Starf gerir tilteknar kröfur um öryggisvitund. Hér er átt við kröfur um færni til að framfylgja öruggum starfsháttum, koma auga á aðstæður sem geta skapað hættu á vinnustað og grípa til viðeigandi ráðstafana til að halda vinnuumhverfinu öruggu.',
    numSteps: 5,
    steps: [
      'Starf krefst þess að starfsmaður fari eftir leiðbeiningum og reglum um öryggi og hollustu, bregðist við augljósum hættum og viti hvert eigi að leita aðstoðar ef þörf er á.',
      'Starf krefst þess að starfsmaður fari eftir leiðbeiningum og reglum um öryggi og hollustu og leitist við að leiðrétta augljóslega hættulegar aðstæður á vinnustað.',
      'Starf krefst þess að starfsmaður fari eftir leiðbeiningum og reglum um öryggi og hollustu, miði að því að auka öryggi og setji fram tillögur sem stuðla að auknu öryggi og betri vinnuaðstæðum.',
      'Starf krefst þess að starfsmaður framfylgi ávallt öruggum starfsháttum, geri kröfu um að farið sé eftir reglum um öryggi og hollustu og stuðli að aukinni öryggisvitund í vinnuumhverfi sínu.',
      'Starf krefst þess að starfsmaður framfylgi ávallt öruggum starfsháttum, miðli reglulega upplýsingum um öruggt verklag og innleiði verklagsreglur um öryggi og hollustuhætti. Greinir mögulegar hættur í tíma og gerir viðeigandi ráðstafanir.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Mannaforráð',
    description:
      'Metin er sú ábyrgð sem starfsmaður ber á vinnu annarra, þ.e. þeirra sem hann hefur formlega umsjón með og ber ábyrgð á, s.s. að ráða starfsmenn, veita hvatningu og móta starfsmannastefnu.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmarkaða eða enga beina ábyrgð á verkstjórn, leiðsögn eða samræmingu á vinnu annarra.',
      'Starfið felur í sér einhverja beina ábyrgð á verkstjórn, samræmingu á vinnu annarra eða þjálfun annarra starfsmanna.',
      'Starfið felur í sér talsverða beina ábyrgð á stjórnun, leiðsögn, samræmingu eða þjálfun og þróun annarra starfsmanna.',
      'Starfið felur í sér mikla beina ábyrgð á stjórnun, leiðsögn, samræmingu og þróun töluverðs fjölda annarra starfsmanna.',
      'Starfið felur í sér mjög mikla beina ábyrgð á stjórnun, leiðsögn, samræmingu og þróun mikils fjölda annarra starfsmanna.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Verkefnastjórnun',
    description:
      'Starf krefst stýringar og skipulags á notkun aðfanga í því skyni að verkefni, atburður eða ferli færist nær verkáfanga eða verklokum.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmarkaða eða enga verkefnastjórnun. Auðlindir/aðföng (resources)eru notaðar í samræmi við starfsreglur.',
      'Starf krefst þess að starfsmaður geri tímaáætlanir og sér til þess að verkefni séu kláruð í tíma. Auðlindir, tæki og tól notuð á hagkvæman hátt.',
      'Starf krefst þess að starfsmaður sé fær um að skipuleggja og stýra verkefnateymi. Hefur umsjón með hagkvæmri nýtingu auðlinda.',
      'Starf krefst þess að starfsmaður skilgreini og nýti árangursmælikvarða með þarfir verkefnis og viðskiptavina í huga.Stýrir og metur notkun auðlinda verkefna/vinnustaðar',
      'Starf krefst þess að starfsmaður þekki til og hafi færni til að nota aðferðafræði verkefnastjórnunar. Starf gerir kröfu um góða yfirsýn yfir verkþætti, áætlanir, samstarfsaðila  og tök á fjölbreyttum vinnu- og matsaðferðum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á fjármálum',
    description:
      'Metin er bein ábyrgð á fjármunum, s.s. reiðufé, beiðnum, ávísunum, reikningsfærslum, rafrænum bankafærslum, reikningum, fjárhagsáætlunum, tekjum og gjöldum.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmarkaða eða enga beina ábyrgð á fjármunum.',
      'Starfið felur í sér nokkra beina ábyrgð á fjármunum.',
      'Starfið felur í sér mikla beina ábyrgð á fjármunum. Fylgist með kostnaði s.s. Gjöldum og tekjum í afmörkuðum verkefnum.',
      'Starfið felur í sér mjög mikla beina ábyrgð á fjármunum. Kemur að ákvörðunum um útgjöld og hagkvæmni.',
      'Starfið felur í sér mjög yfirgripsmikla beina ábyrgð á fjármunum. Felur í sér ábyrgð á reikningum og reikningsskilum og umsjón með framkvæmd, þróun og endurskoðun fjármála.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á þjónustu',
    description: 'Metin er á bein ábyrgð á þjónustu.',
    numSteps: 4,
    steps: [
      'Starfið felur í sér takmarkaða eða enga beina ábyrgð á þjónustu.',
      'Starfið felur í sér nokkra beina ábyrgð á framkvæmd þjónustu.',
      'Starfið felur í sér mikla beina ábyrgð á þjónustu, s.s. Skipulag og mat á einstaka þjónustuþáttum.',
      'Starfið felur í sér mjög yfirgripsmikla beina ábyrgð á þjónustu s.s. skipulag, þróun, mat og umbætur á þjónustu ásamt innleiðingu á breytingum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á upplýsingagjöf',
    description: 'Metin er á bein ábyrgð á upplýsingagjöf.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmarkaða eða enga beina ábyrgð á upplýsingagjöf.',
      'Starfið felur í sér nokkra beina ábyrgð á upplýsingagjöf.',
      'Starfið felur í sér mikla beina ábyrgð á upplýsingagjöf.',
      'Starfið felur í sér mjög mikla beina ábyrgð á upplýsingagjöf.',
      'Starfið felur í sér mjög yfirgripsmikla beina ábyrgð á upplýsingagjöf.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á fólki',
    description:
      'Metin er sú ábyrgð sem starfsmaður ber á einstaklingum eða hópum (t.d. almenningi, þjónustuþegum og/eða viðskiptavinum)',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmörkuð eða engin bein áhrif á velferð einstaklinga eða hópa.',
      'Starfið felur í sér einhver bein áhrif á velferð einstaklinga eða hópa vegna verkefna eða skyldna sem snúa beint að hag þeirra.',
      'Starfið felur í sér talsverð bein áhrif á velferð einstaklinga eða hópa, t.d. þegar  starfsmaður þarf að greina þarfir einstaklinga eða hópa eða ef hann þarf að framfylgja/innleiða lög sem hafa áhrif á þá.',
      'Starfið felur í sér mikil bein áhrif á velferð einstaklinga eða hópa, t.d. þegar starfsmaður þarf að greina/meta þörf fyrir þjónustu eða ef hann þarf að framfylgja/innleiða lög sem hafa áhrif á einstaklinga eða hópa.',
      'Starfið felur í sér mjög mikil bein áhrif á velferð einstaklinga eða hópa sem eru háðir þjónustu frá starfsmanninum. Starfsmaður vinnur úr og metur þarfir fólks og skipuleggur hvernig ákveðin umönnun, þjónusta eða stuðningur er veittur.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title:
      'Ábyrgð á öryggi og hreinlæti (þarf að skilgreina nánar) og umhverfi.',
    description:
      'Fólk, upplýsingaöryggi, slysahættur, umhverfið, öryggisvitund (hæfni), ræstingar, matvæli. Að stöðlum sé fylgt eftir.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmarkaða eða enga beina ábyrgð á öryggi og/eða hreinlæti. Getur leyst og haldið utan um öryggi í afmörkuðu verkefni.',
      'Starfið felur í sér nokkra beina ábyrgð á öryggi og/eða hreinlæti. Getur haldið utan um algeng verkefni öryggismála.',
      'Starfið felur í sér mikla beina ábyrgð á öryggi og/eða hreinlæti. Hefur yfirsýn yfir öryggismál á ákveðnu sviði.',
      'Starfið felur í sér mjög mikla beina ábyrgð á öryggi og/eða hreinlæti. Hefur yfirsýn og ber ábyrgð á réttri framkvæmd öryggismála á sínu sviði.',
      'Starfið felur í sér mjög yfirgripsmikla beina ábyrgð á öryggi og/eða hreinlæti. Hefur sérþekkingu á öryggismálum og þróar nýja nálgun eða umbætur út frá mati. Stýrir prófunum, leiðréttir og leiðbeinir.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á gæðum',
    description:
      'Hér er metin ábyrgð á því hvernig efnisleg og huglæg gæði eru nýtt, hvernig þeirra er aflað og þeim skipt.',
    numSteps: 5,
    steps: [
      'Ábyrgð á gæðum er bundin við eðlilega aðgæslu á þeim verkefnum sem starfsmanninum eru falin.',
      'Starfsmaður ber ábyrgð á öflun verkefna og/eða úrlausn verkefna og/eða öflun tekna til sérverkefna.',
      'Starfsmaður ber ábyrgð á framkvæmd tillagna/ákvarðana um starfsemi. Fylgist með og tryggir hagkvæma notkun verðmæta.',
      'Starfsmaður ber ábyrgð á tillögum um ákvarðanir varðandi starfsemi. Stýrir og metur notkun verðmæta',
      'Starfsmaður ber ábyrgð á ákvörðunum sem ætlað er að hafa miklar breytingar í för með sér. Ábyrgð á skilgreiningum og forgangsröðun verkefna og mat á skilvirkni í notkun gæða.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á búnaði (eða auðlindum)',
    description:
      'Metin er sú beina ábyrgð sem starfsmaður ber á búnaði, s.s. hugbúnaði, upplýsingakerfum, gögnum eða skjölum, verkfærum, tækjum og vélum, vörubirgðum, byggingum, landareignum og öðrum svæðum.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmarkaða eða enga beina ábyrgð á búnaði, tækjum og mannvirkjum.',
      'Starfið felur í sér nokkra beina ábyrgð á búnaði, tækjum og mannvirkjum.',
      'Starfið felur í sér talsverða beina ábyrgð á búnaði, tækjum og mannvirkjum.',
      'Starfið felur í sér mikla beina ábyrgð á búnaði, tækjum og mannvirkjum.',
      'Starfið felur í sér mjög mikla beina ábyrgð á búnaði, tækjum og mannvirkjum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.RESPONSIBILITY,
    parentTitle: 'Ábyrgð',
    title: 'Ábyrgð á trúnaðarupplýsingum',
    description: 'Metin er á bein ábyrgð á trúnaðarupplýsingum.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér takmarkaða eða enga beina ábyrgð á trúnaðarupplýsingum.',
      'Starfið felur í sér nokkra beina ábyrgð á trúnaðarupplýsingum.',
      'Starfið felur í sér mikla beina ábyrgð á trúnaðarupplýsingum.',
      'Starfið felur í sér mjög mikla beina ábyrgð á trúnaðarupplýsingum.',
      'Starfið felur í sér mjög yfirgripsmikla beina ábyrgð á trúnaðarupplýsingum.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.STRAIN,
    parentTitle: 'Álag',
    title: 'Tilfinningalegt álag',
    description:
      'Metið er það tilfinningalega álag sem í starfinu felst vegna eðli starfsins eða samkipta starfsmanns við aðra t.d. einstaklinga sem eru reiðir, ósamvinnuþýðir eða veikir. Getur einnig átt við um viðvarandi álag vegna tímapressu og ófyrirséðrar viðveru. Samskipti eða aðstæður hafa bein áhrif á líðan starfsmanns á þann hátt að það komi honum í tilfinningalegt uppnám, t.d. að hann finni fyrir streitu, vanmætti, sorg, spennu eða reiði.',
    numSteps: 5,
    steps: [
      'Starfið felur í sér lítið eða takmarkað tilfinningalegt álag. Samskipti við aðila sem gætu, vegna aðstæðna sinna eða hegðunar, valdið starfsmanni tilfinningalegu álagi eru sjaldgæf og teljast til undantekninga.',
      'Starfið felur í sér stundum tilfinningalegt álag. Starfsmaður er í samskiptum við aðila sem vegna aðstæðna sinna eða hegðunar geta öðru hverju valdið starfsmanni einhverju tilfinningalegu álagi.',
      'Starfið felur í sér nokkuð tilfinningalegt álag eða öðru hverju umtalsvert tilfinningalegt álag. Gert er ráð fyrir að tilfinningalegt álag sé fyrirsjáanlegur hluti starfsins.  Starfsmaður er í samskiptum við krefjandi aðila eða hópa eða vinnur náið með einstaklingum sem vegna aðstæðna sinna valda starfsmanninum tilfinningalegu álagi.',
      'Starfið felur í sér umtalsvert tilfinningalegt álag eða öðru hverju mjög mikið tilfinningalegt álag. Gert er ráð fyrir að tilfinningalegt álag sé reglulegur og fyrirsjáanlegur hluti starfsins. Starfsmaður er í samskiptum við krefjandi aðila eða hópa sem vegna aðstæðna sinna valda starfsmanninum reglulegu tilfinningalegu álagi. Starfsmaður þarf að taka ákvarðanir um úrræði fyrir krefjandi aðila og fylgja málum þeirra eftir. Starfinu fylgir umtalsverð tilfinningaleg áreynsla.',
      'Starfið felur í sér mjög mikið viðvarandi tilfinningalegt álag. Gert er ráð fyrir að mjög mikið tilfinningalegt álag sé óhjákvæmilegur hluti starfsins. Starfsmaður er í samskiptum við aðila eða hópa sem vegna aðstæðna sinna valda starfsmanninum mjög miklu viðvarandi tilfinningalegu álagi. Starfsmaður þarf að taka ákvarðanir um úrræði fyrir aðra og ber ábyrgð á ákvarðanatöku í málum sem hafa veruleg áhrif á aðstæður og velferð þeirra.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.STRAIN,
    parentTitle: 'Álag',
    title: 'Líkamlegt álag',
    description:
      'Metið er það líkamlega álag sem í starfinu felst, hvort starfsmaður þurfi úthald og líkamlegan styrk til að sinna verkefnum starfsins og hversu mikið reynir á slíkt. Tekið er tillit til mismunandi tegunda líkamlegs álags, t.d. líkamlegrar áreynslu vegna meðhöndlunar þungra byrða (lyfta, bera, færa úr stað), vinnustellinga og hreyfingar (standa, ganga, sitja, beygja sig, krjúpa, klifra), samhæfingar (fín- og grófhreyfingar) og líkamlegra viðbragða og stjórnar (vegna notkunar tækja og vélbúnaðar).',
    numSteps: 3,
    steps: [
      'Í starfinu felst lítið eða takmarkað líkamlegt álag. Starfið er að mestu unnið í sitjandi stöðu og auðvelt er að standa upp reglulega og hreyfa sig. Einhverjar kröfur kunna að vera gerðar um að standa, ganga, beygja sig eða teyja og stöku sinnum kann að vera þörf á að lyfta eða bera létta hluti.',
      'Starfinu fylgir eitthvert viðvarandi líkamlegt álag eða takmarkað líkamlegt álag að jafnaði. Til dæmis regluleg seta í þvingaðri stöðu, að standa eða ganga á eðlilegum hraða í lengri tíma, að lyfta, bera eða færa úr stað létta eða meðalþunga hluti eða að þrífa eða starfa í óþægilegri vinnustellingu.',
      'Í starfinu felst reglulegt líkamlegt álag eða öðru hverju umtalsvert líkamlegt álag. Til dæmis þegar reglulega þarf að lyfta, bera eða færa úr stað meðalþunga hluti eða skrúbba, starfa í óþægilegri vinnustellingu, meðhöndla reglubundið þungar byrðar eða starfa í mjög óþægilegri líkamsstellingu reglubundið.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.STRAIN,
    parentTitle: 'Álag',
    title: 'Áreiti og andlegt álag',
    description:
      'Metið er það andlega álag sem í starfinu felst, hvort starfið krefjist athygli, árverkni og einbeitingar og hversu mikið reynir á slíkt, m.a. vegna þess áreitis sem hlýst af aðgengi annarra að starfsmanni. Tekið er tillit til mismunandi tegunda andlegrar áreynslu, til dæmis að hugsa, horfa og hlusta.',
    numSteps: 3,
    steps: [
      'Í starfinu felst lítið eða takmarkað andlegt álag. Gerðar eru eðlilegar kröfur um andlega áreynslu, athygli, árverkni og einbeitingu. Starfið er yfirleitt unnið án þess að þörf sé á yfirvinnu, truflanir eru sjaldgæfar, starfsmenn stjórna eigin vinnuhraða og yfirleitt er lítill þrýstingur um að klára þurfi verkefni á ákveðnum tíma.',
      'Starfinu fylgir öðru hverju andlegt álag. Gerðar eru einhverjar kröfur um andlega áreynslu, athygli, árverkni og einbeitingu. Einstaka sinnum gæti starfsmaður þurft að vinna yfirvinnu til að ljúka verkefnum og truflanir eru hóflegar. Starfsmenn stjórna yfirleitt vinnuhraða sínum en stundum er þrýstingur um að klára þurfi verkefni á ákveðnum tíma.',
      'Í starfinu felst nokkuð andlegt álag. Gert er ráð fyrir að andleg áreynsla sé fyrirsjáanlegur hluti starfsins og gerðar eru þó nokkrar kröfur um athygli, árverkni og einbeitingu. Starfið krefst mikillar viðveru á vinnustöð og getur komið upp að frítími skerðist eða að þörf sé á að starfsmaður vinni yfirvinnu. Truflanir eða félagslegt áreiti er umtalsvert. Starfsmenn stjórna oftast vinnuhraða sínum en nokkur þrýstingur er á að klára verkefni á ákveðnum tíma.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Vinnuumhverfi',
    description:
      'Í þessum þætti eru metnar vinnuaðstæður sem geta talist óæskilegar, óþægilegar eða hættulegar sökum umhverfisþátta eða vinnu með fólki. Þeir þættir sem taka þarf tillit til eru m.a. eiturefni, gufur, hávaði af öllum gerðum (vegna véla, umhverfis, manna), lýsing, glampi, hitastig, hitabreytingar. óhreinindi, ryk, loftræsting, raki, titringur, líkamsvessar, úrgangur, óþefur, reykur, fita, olía, skörp áhöld og verkfæri, veður, ónæði, umgangur og einangrun, Einnig er metin hætta á meiðslum, veikindum og heilsufarsvandamálum, s.s. vegna nálægðar við eiturefni, vélar og sjúkdóma. Einnig ef hætta er á einhverskonar ofbeldi eða ágengni. Tekið er tillit til hversu oft og hversu lengi starfsmaður þarf að vinna við óæskilegar, óþægilegar eða hættulegar aðstæður. Metnir eru þeir þættir sem eru óhjákvæmilegur hluti starfsins. Ávallt er gert ráð fyrir að farið sé að heilbrigðis- og öryggiskröfum og reglugerðum.',
    numSteps: 2,
    steps: [
      'Starfið krefst þess sjaldan að starfsmaður vinni við aðstæður sem geta talist óæskilegar, óþægilegar eða hættulegar. Lítil sem engin hætta er á ofbeldi, ágengni, meiðslum, sjúkdómum eða öðrum heilsufarsvandamálum.',
      'Starfið krefst þess að starfsmaður vinni stundum við aðstæður sem geta talist óæskilegar, óþægilegar eða hættulegar. Ekki er þörf á að starfsmaður noti sérstakan öryggisbúnað við störf sín eða að gripið sé til sérstakra varúðarráðstafana. Eða að hætta á ofbeldi, ágengni eða óviðeigandi hegðun annars fólks er stundum til staðar.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Hávaði',
    description:
      'Metið er hvort starf geri kröfur um að starfsmaður starfi við hávaða. Hávaði telst vera óæskilegt hljóð og er styrkur þess mældur í desíbilum (dB). Sá tími sem unnið er í hávaða hefur einnig áhrif á skaðsemi hávaðans. Hávaði getur m.a. orsakast af margskonar vélarhljóðum, vinnuvélum, tækjum og fólki. Ávallt er gerð ráð fyrir að farið sé að heilbrigðis- og öryggiskröfum, lögum um aðbúnað, hollustuhætti og öryggi á vinnustöðum og reglugerðum.',
    numSteps: 5,
    steps: [
      'Starfið gerir sjaldan kröfur um að starfsmaður starfi við hávaða. Óæskilegur hávaði sem veldur starfsmanni óþægindum er sjaldgæfur og telst til undantekninga.',
      'Starfið gerir öðru hverju kröfur um að starfsmaður starfi við hávaða. Starfinu fylgir tímabundinn hávaði frá vélum, tækjum, búnaði og fólki.',
      'Starfið gerir þó nokkrar kröfur um að starfsmaður starfi við hávaða. Gert er ráð fyrir að hávaði sé fyrirsjáanlegur hluti starfsins. Starfinu fylgir tímabundinn hávaði frá vélum, tækjum og búnaði en stöðugur hávaði frá fólki.',
      'Starfið gerir umtalsverðar kröfur um að starfsmaður starfi við hávaði. Gert er ráð fyrir að hávaði sé reglulegur og fyrirsjáanlegur hluti starfsins. Starfinu fylgir tímabundinn hávaði frá fólki en stöðugur hávaði frá vélum, tækjum og búnaði.',
      'Starfið gerir mjög miklar kröfur um að starfsmaður starfi við hávaða. Gert er ráð fyrir að mikill hávaði sé óhjákvæmilegur hluti starfsins. Starfinu fylgir stöðugur hávaði frá vélum, tækjum, búnaði og fólki.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Lýsing',
    description:
      'Metið er hvort starf geri kröfur um að starfsmaður starfi við slæma lýsingu. Tekið er tillit til mismunandi ljósgjafa (dagsbirta, innilýsing) og dreifingar birtu. Of mikið eða of lítið birtugildi telst óæskilegt en þegar meta á áhrif lýsingarbúnaðar á starfsmann þarf þó einnig að taka tillit til annarra eiginleika lýsingarinnar og umhverfis, s.s. endurskin og ofbirtu. Ávallt er gert ráð fyrir að farið sé að heilbrigðis- og öryggiskröfum, lögum og reglugerðum.',
    numSteps: 5,
    steps: [
      'Starfið gerir sjaldan kröfur um að starfsmaður starfi við óæskilega lýsingu. Óæskileg lýsing sem veldur starfsmanni óþægindum er sjaldgæf og telst til undantekninga.',
      'Starfið gerir öðru hverju kröfur um að starfsmaður starfi við óæskilega lýsingu. Starfið er unnið í bæði náttúrulegri lýsingu og raflýsingu.',
      'Starfið gerir þó nokkrar kröfur um að starfsmaður starfi við óæskilega lýsingu. Gert er ráð fyrir að óæskileg lýsing sé fyrirsjáanlegur hluti starfsins. Starfið er unnið í náttúrulegri lýsingu en einnig á svæðum sem lýst eru upp með raflýsingu og birtuskilyrði eru sumstaðar slæm.',
      'Starfið gerir umtalsverðar kröfur um að starfsmaður starfi við óæskilega lýsingu. Gert er ráð fyrir að óæskileg lýsing sé reglulegur og fyrirsjáanlegur hluti starfsins. Starfið er eingöngu unnið á svæðum sem lýst eru upp með raflýsingu.',
      'Starfið gerir mjög miklar kröfur um að starfsmaður starfi við óæskilega lýsingu. Gert er ráð fyrir að óæskileg lýsing sé óhjákvæmilegur hluti starfsins. Starfið er unnið á svæðum sem eingöngu eru lýst upp með raflýsingu og þar eru einnig illa upplýst svæði.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Gufur og eiturefni',
    description:
      'Metið er hvort starf geri kröfur um að starfsmaður starfi við áhættu vegna efnanotkunar, s.s. gas, gufur og leysiefni. Ávallt er gert ráð fyrir að farið sé að heilbrigðis- og öryggiskröfum, lögum og reglugerðum. Auk þess að farið sé eftir þeim öryggisblöðum sem fylgja efnunum hverju sinni.',
    numSteps: 5,
    steps: [
      'Starfið gerir sjaldan eða aldrei kröfur um að starfsmaður sé útsettur fyrir óæskilegum efnum. Nálægð við efni sem geta valdið starfsmanni óþægindum er sjaldgæf og telst til undantekninga.',
      'Starfið gerir öðru hverju kröfur um að starfsmaður sé útsettur fyrir óæskilegum efnum, eins og hreinsiefnum og gufu, en þó í litlu mæli.',
      'Starfið gerir þó nokkrar kröfur um að starfsmaður sé útsettur fyrir óæskilegum eða hættulegum efnum. Gert er ráð fyrir að vinna í eða með efni sem geta valdið starfsmanni óþægindum eða skaða sé fyrirsjáanlegur hluti starfsins.',
      'Starfið gerir umtalsverðar kröfur um að starfsmaður sé útsettur fyrir óæskilegum eða hættulegum efnum. Gert er ráð fyrir að slík efni, t.d. gufa, hreinsiefni, kolmónoxíð, reykur og eiturefni, séu reglulegur og fyrirsjáanlegur hluti starfsins.',
      'Starfið gerir mjög miklar kröfur um að starfsmaður sé útsettur fyrir óæskilegum eða hættulegum efnum. Gert er ráð fyrir að slík efni, t.d. gufa, hreinsiefni, kolmónoxíð, reykur og eiturefni, séu óhjákvæmilegur hluti starfsins.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Vinnuhraði',
    description:
      'Metinn er sá vinnuhraði sem starfið krefst. Vinnuhraði vísar til þess hversu mikið starfsmaður þarf að vinna. Einnig er metið hvort í starfinu felist að starfsmaður lendi í tímapressu.',
    numSteps: 3,
    steps: [
      'Starfsmaður stýrir vinnuhraða sínum og tímapressa er sjaldgæf.',
      'Starfsmaður stýrir yfirleitt vinnuhraða sínum en einhver tímapressa kann að vera til staðar.',
      'Starfsmaður stýrir ekki alltaf vinnuhraða sínum og tímapressa er töluverð.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.CONDITION,
    parentTitle: 'Vinnuaðstæður',
    title: 'Hætta á slysum og sjúkdómum',
    description:
      'Metin er hætta á slysum og sjúkdómum í starfi. Tekið er tillit til allra vinnuaðstæðna sem hugsanlega geta valdið starfsmanni skaða. Ávallt er gert ráð fyrir að farið sé að heilbrigðis- og öryggiskröfum, lögum og reglugerðum.  Dæmi um hættur og afleiðingar eru skurðir, bruni, að detta, eitranir, sprengingar, raflost, líkamleg meiðsl, heyrnarskemmdir, húðsjúkdómar, smitsjúkdómar, ofnæmi, streita, stoðkerfisvandamál og öndunarfærasjúkdómar. Ávallt er gert ráð fyrir að farið sé að heilbrigðis- og öryggiskröfum og reglugerðum.',
    numSteps: 5,
    steps: [
      'Í starfinu felst lítil eða takmörkuð hætta á slysum og sjúkdómum.',
      'í starfinu felst nokkur hætta á slysum og sjúkdómum, en hætta á alvarlegum sjúkdómum og slysum er mjög lítil og telst til undantekninga.',
      'Í starfinu felst þó nokkur hætta á slysum og sjúkdómum. Slík hætta er fyrirjáanlegur hluti starfsins.',
      'Í starfinu felst umtalsverð og viðvarandi hætta á slysum og sjúkdómum. Slík hætta er reglulegur og fyrirjáanlegur hluti starfsins.',
      'Í starfinu felst mjög mikil hætta á slysum og sjúkdómum. Slík hætta er óhjákvæmilegur hluti starfsins.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Frammistöðumat',
    title: 'Frammistöðumat',
    description:
      'Hér getur fyrirtæki skilgreint niðurstöður úr frammistöðumati. Ef einungis eru skráðar niðurstöður þá þarf að liggja fyrir upplýsingar, rekjanlegar og skjalfestar um hvernig komist var að umræddri niðurstöðu.',
    numSteps: 5,
    steps: [
      'Niðurstaða úr frammistöðumati 1. T.d. Undir væntingum',
      'Niðurstaða úr frammistöðumati 2. T.d. Stendur undir væntingum',
      'Niðurstaða úr frammistöðumati 3. T.d. Umfram væntingar',
      'Niðurstaða úr frammistöðumati 4. T.d. umfram væntingar og framúrskarandi á vissum sviðum.',
      'Niðurstaða úr frammistöðumati 5. T.d. Framúrskarandi',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Þjálfun annars starfsfólks/handleiðsla',
    description:
      'Þátttaka starfsmanns í þjálfun nýs/annars starfsfólks sem metin er til launa.',
    numSteps: 5,
    steps: [
      'Starfsmaður tekur lítinn eða engan þátt í þjálfun nýs/annars starfsfólks',
      'Starfsmaður tekur þátt í þjálfun nýs/annars starfsfólks',
      'Starfsmaður tekur þátt í þjálfun nýs/annars starfsfólks og ber einhverja ábyrgð á henni.',
      'Starfsmaður skipuleggur og tekur mikinn þátt í þjálfun nýs/annars starfsfólks',
      'Starfsmaður ber ábyrgð á skipulagi og þjálfun nýs/annars starfsfólks',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Starfsreynsla / starfsaldur',
    description:
      'Starfsaldur/starfsþjálfun á vinnustað og/eða í sambærilegu starfi sem metin er til launa.',
    numSteps: 5,
    steps: [
      'Starfsmaður hefur ekki starfsreynslu.',
      'Starfsmaður hefur nokkra starfsreynslu (1-2 ár).',
      'Starfsmaður hefur nokkuð mikla starfsreynslu (2-5 ár).',
      'Starfsmaður hefur mikla starfsreynslu (5-8 ár).',
      'Starfsmaður hefur mjög mikla starfsreynslu (8 ár eða meira) og getu til að leiðbeina.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Menntun',
    description:
      'Menntun umfram kröfur til starfs sem metin er til launa. T.d. krafa um iðnmenntun en starfsmaður hefur meistararéttindi, krafa um stúdentspróf en st.m. hefur háskólapróf. o.s.frv.',
    numSteps: 3,
    steps: [
      'Starfsmaður hefur ekki menntun umfram kröfur til starfs sem metin er til launa.',
      'Starfsmaður hefur menntun umfram kröfur til starfs, t.d. námskeið eða diplómu',
      'Starfsmaður hefur formlega menntun umfram kröfur til starfs sem nýtist vel í núverandi starfi',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Hugræn færni',
    description:
      'Færni, umfram það sem starfið krefst, til að þróa, greina og leysa vandamál og leggja mat á viðfangsefni hverju sinni, og metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki hugræna færni, umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Félagsleg færni',
    description:
      'Færni og geta til að vinna með öðrum á árangursríkan hátt og setja sig í spor annarra umfram það sem starfið krefst og metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki félagslega færni, umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Líkamleg færni (eða lipurð og handlagni)',
    description:
      'Sérstök líkamleg færni, umfram það sem venjulegt er, og metin er til launa. Átt er við t.d. líkamlegan styrk, handlagni, fingrafimi, lipurð, samhæfingu augna og handa og samhæfingu skynfæra.',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki félagslega færni, umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Upplýsingatækni',
    description:
      'Færni starfsmanns, umfram það sem starfið krefst, til að nota tölvutækni, tæki og forrit við öflun upplýsinga og þekkingar, upplýsinga- og gagnavinnslu og í samskiptum, og metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki færni til að nota tölvutækni, tæki og forrit við öflun upplýsinga og þekkingar, upplýsinga- og gagnavinnslu og í samskiptum umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Upplýsingalæsi',
    description:
      'Færni, umfram það sem starfið krefst, til að vinna með fjölbreyttar upplýsingar og setja skilmerkilega fram (s.s. með því að finna efni, greina, meta, vista, miðla og nýta), og metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki færni til að vinna með fjölbreyttar upplýsingar og setja skilmerkilega fram umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Tölvunotkun',
    description:
      'Geta til að nýta forrit, gagnagrunna og kerfi umfram það sem starf krefst, og metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki getu til að nýta forrit, gagnagrunna og kerfi umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Íslenska',
    description:
      'Þekking, skilningur og notkun á íslensku máli umfram það sem starfið krefst og metin er til launa. (T.d. prófarkalestur sem ekki er hluti af starfslýsingu starfsmanns).',
    numSteps: null,
    steps: [
      'Þekking, skilningur og notkun starfsmanns á íslensku máli nýtist fyrirtæki/stofnun ekki umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Erlend tungumál',
    description:
      'Þekking, skilningur og notkun á erlendu tungumáli sem nýtist fyrirtæki/stofnun og metin er til launa. (T.d. skrif, þýðingar, túlkun og verkefni sem ekki eru hluti af starfslýsingu starfsmanns og annars væri útvistað).',
    numSteps: null,
    steps: [
      'Þekking, skilningur og notkun starfsmanns á erlendu tungumáli nýtist fyrirtæki/stofnun ekki umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Sjálfstæði',
    description:
      'Færni og vilji starfsmanns til að grípa til sjálfstæðra aðgerða, og skipuleggja og ljúka verkefnum, umfram það sem starfið krefst, sem metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki sjálfstæði umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Frumkvæði',
    description:
      'Frumkvæði og vilji starfsmanns, umfram það sem starfið krefst, sem metin eru til launa. (T.d. við að koma í veg fyrir og leysa vandamál, bæta verkferla, nýta tækifæri til hagræðingar og skilvirkni, og bera kennsl á tækifæri fyrir vinnustaðinn).',
    numSteps: null,
    steps: [
      'Starfsmaður sýnir ekki frumkvæði umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Samskiptafærni',
    description:
      'Þekking og færni starfsmanns í munnlegum og/eða skriflegum samskiptum sem ekki er hluti af starfslýsingu og nýtist fyrirtæki/stofnun, og metin er til launa.',
    numSteps: null,
    steps: [
      'Samskiptafærni starfsmanns nýtist fyrirtæki/stofnun ekki umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title: 'Ábyrgð á upplýsingagjöf',
    description:
      'Ábyrgð á upplýsingagjöf umfram starfslýsingu sem metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður ber ekki ábyrgð á upplýsingagjöf umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
  {
    criterionType: ReportCriterionTypeEnum.PERSONAL,
    parentTitle: 'Einstaklingsbundinn þáttur',
    title:
      'Ábyrgð á öryggi og hreinlæti (þarf að skilgreina nánar) og umhverfi.',
    description:
      'Ábyrgð á öryggi, hreinlæti og/eða umhverfi umfram það sem starfið krefst og metin er til launa.',
    numSteps: null,
    steps: [
      'Starfsmaður ber ekki ábyrgð á öryggi, hreinlæti og/eða umhverfi umfram það sem starfið krefst skv. Starfslýsingu.',
    ],
  },
]
