import type {
  SearchDashboardBreakdownCardProps,
  SearchDashboardFilterPreset,
  SearchDashboardFilterValue,
  SearchDashboardKpiItem,
  SearchDashboardQueryTableProps,
  SearchDashboardTrendChartProps,
} from '@dmr.is/ui/components/SearchDashboard'

import type {
  SearchAnalyticsBreakdownsResponse,
  SearchAnalyticsOverviewResponse,
  SearchAnalyticsQueriesResponse,
  SearchAnalyticsTrendsResponse,
} from '../lib/search-analytics/types'

export const SEARCH_DASHBOARD_PRESETS: SearchDashboardFilterPreset[] = [
  { label: '7 dagar', value: '7d' },
  { label: '30 dagar', value: '30d' },
  { label: '90 dagar', value: '90d' },
]

export const DEFAULT_SEARCH_DASHBOARD_PRESET = '30d'

const QUERY_KIND_LABELS: Record<string, string> = {
  empty: 'Tóm leit',
  free_text: 'Frjáls leit',
  prefix_wildcard: 'Forskeytisleit',
  publication_number: 'Birtingarnúmer',
  internal_case_number: 'Málnúmer',
}

const FILTER_LABELS: Record<string, string> = {
  department: 'Deild',
  type: 'Tegund',
  mainType: 'Yfirflokkur',
  category: 'Flokkur',
  involvedParty: 'Málsaðili',
  year: 'Ár',
  dateFrom: 'Dagsetning frá',
  dateTo: 'Dagsetning til',
}

const SORT_LABELS: Record<string, string> = {
  default: 'Sjálfgefin röðun',
  'publicationDate:DESC': 'Nýjast fyrst',
  'publicationDate:ASC': 'Elst fyrst',
}

const QUERY_TABLE_COLUMNS = [
  {
    key: 'normalizedQuery' as const,
    label: 'Leit',
    align: 'left' as const,
    helpText:
      'Leitarstrengurinn eins og hann er birtur í samantektinni. Taflan sýnir aðeins leitir sem hafa komið fyrir endurtekið á valda tímabilinu.',
  },
  {
    key: 'count' as const,
    label: 'Fjöldi',
    align: 'right' as const,
    helpText: 'Hversu oft þessi leit kom fyrir á valda tímabilinu.',
  },
  {
    key: 'zeroResultRate' as const,
    label: '0 niðurstöður',
    align: 'right' as const,
    helpText: 'Hlutfall tilvika þessarar leitar sem skiluðu engum niðurstöðum.',
  },
  {
    key: 'avgDurationMs' as const,
    label: 'Meðaltími',
    align: 'right' as const,
    helpText: 'Meðalsvörun fyrir þessa tilteknu leit á valda tímabilinu.',
  },
  {
    key: 'resultBucket' as const,
    label: 'Niðurstöður',
    align: 'right' as const,
    helpText:
      'Dæmigerður niðurstöðuflokkur fyrir leitina. Gildin eru sýnd sem bil frekar en nákvæm tala.',
  },
]

const formatDateParam = (date: Date): string => {
  return date.toISOString().slice(0, 10)
}

export const getPresetRange = (
  preset: string,
  now = new Date(),
): SearchDashboardFilterValue => {
  const to = new Date(now)
  const from = new Date(now)
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30

  from.setUTCDate(from.getUTCDate() - (days - 1))

  return {
    from: formatDateParam(from),
    to: formatDateParam(to),
    preset,
  }
}

const normalizeDate = (value: string | undefined): string | null => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? (value as string) : null
}

export const resolveSearchDashboardFilters = (params?: {
  from?: string
  to?: string
  preset?: string
}): SearchDashboardFilterValue => {
  const preset = SEARCH_DASHBOARD_PRESETS.some(
    (option) => option.value === params?.preset,
  )
    ? params?.preset
    : DEFAULT_SEARCH_DASHBOARD_PRESET

  const normalizedFrom = normalizeDate(params?.from)
  const normalizedTo = normalizeDate(params?.to)

  if (normalizedFrom && normalizedTo) {
    return {
      from: normalizedFrom,
      to: normalizedTo,
      preset:
        params?.preset &&
        SEARCH_DASHBOARD_PRESETS.some(
          (option) => option.value === params.preset,
        )
          ? params.preset
          : null,
    }
  }

  return getPresetRange(preset ?? DEFAULT_SEARCH_DASHBOARD_PRESET)
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`
const formatDuration = (value: number) => `${value} ms`

const mapBreakdownItems = (
  items: SearchAnalyticsBreakdownsResponse['queryKinds'],
  labels: Record<string, string> = {},
) => {
  return items.map((item) => ({
    label: labels[item.key] ?? item.key,
    value: formatPercent(item.percentage),
    count: item.count,
    percentage: item.percentage,
  }))
}

export const mapOverviewToKpis = (
  overview?: SearchAnalyticsOverviewResponse,
): SearchDashboardKpiItem[] => {
  if (!overview) {
    return []
  }

  return [
    {
      label: 'Leitir alls',
      value: overview.totalSearches.toString(),
      helpText: 'Heildarfjöldi leita á valda tímabilinu.',
    },
    {
      label: '0 niðurstöður',
      value: formatPercent(overview.zeroResultRate),
      helpText:
        'Hlutfall leita sem skiluðu engum niðurstöðum. Hátt hlutfall getur bent til þess að efni vanti eða að leitarskilyrðin séu of þröng.',
    },
    {
      label: 'Með síum',
      value: formatPercent(overview.withFiltersRate),
      helpText:
        'Hlutfall leita þar sem notandi notaði að minnsta kosti eina síu.',
    },
    {
      label: 'Meðaltími',
      value: formatDuration(overview.avgDurationMs),
      helpText: 'Meðalsvörun allra leita á tímabilinu, mæld í millisekúndum.',
    },
    {
      label: 'P95',
      value: formatDuration(overview.p95DurationMs),
      helpText:
        '95% leita klárast innan þessa tíma. Mælikvarðinn sýnir betur hægari hala leitanna en venjulegt meðaltal.',
    },
    {
      label: 'Síða eitt',
      value: formatPercent(overview.pageOneRate),
      helpText:
        'Hlutfall leita sem áttu sér stað á fyrstu síðu niðurstaðna. Lægra hlutfall getur bent til þess að notendur fari oftar áfram á næstu síður.',
    },
  ]
}

export const mapTrendsToCharts = (
  trends?: SearchAnalyticsTrendsResponse,
): SearchDashboardTrendChartProps[] => {
  const points = trends?.points ?? []

  return [
    {
      title: 'Leitarmagn',
      description: 'Fjöldi leita á dag',
      helpText:
        'Sýnir hversu margar leitir voru framkvæmdar á hverjum degi á valda tímabilinu.',
      points: points.map((point) => ({
        label: point.date,
        value: point.totalSearches,
      })),
    },
    {
      title: '0 niðurstöður',
      description: 'Hlutfall leita sem skiluðu engu',
      helpText: 'Sýnir hlutfall daglegra leita sem skiluðu engum niðurstöðum.',
      points: points.map((point) => ({
        label: point.date,
        value: point.zeroResultRate,
      })),
      valueFormatter: formatPercent,
    },
    {
      title: 'Meðaltími',
      description: 'Meðalsvörun á dag',
      helpText: 'Sýnir meðalsvörun leitar á hverjum degi, í millisekúndum.',
      points: points.map((point) => ({
        label: point.date,
        value: point.avgDurationMs,
      })),
      valueFormatter: formatDuration,
    },
    {
      title: 'P95 tími',
      description: 'Hægari hluti leitanna',
      helpText:
        '95% daglegra leita klárast innan þessa tíma. Þetta sýnir hvort hægasti hluti leitanna sé að versna þótt meðaltalið haldist stöðugt.',
      points: points.map((point) => ({
        label: point.date,
        value: point.p95DurationMs,
      })),
      valueFormatter: formatDuration,
    },
  ]
}

export const mapBreakdownsToCards = (
  breakdowns?: SearchAnalyticsBreakdownsResponse,
): SearchDashboardBreakdownCardProps[] => {
  if (!breakdowns) {
    return []
  }

  return [
    {
      title: 'Leitargerðir',
      helpText:
        'Sýnir hvernig leitir skiptast eftir gerð, til dæmis frjáls leit, málanúmer eða birtingarnúmer.',
      items: mapBreakdownItems(breakdowns.queryKinds, QUERY_KIND_LABELS),
    },
    {
      title: 'Niðurstöðuflokkar',
      helpText:
        'Sýnir í hvaða stærðarbil niðurstöðurnar falla. Þetta eru flokkar eins og 0, 1, 2-10 og 200+, ekki nákvæm tala fyrir hverja leit.',
      items: mapBreakdownItems(breakdowns.resultBuckets),
    },
    {
      title: 'Röðun',
      helpText:
        'Sýnir hvaða röðun notendur völdu þegar þeir skoðuðu niðurstöður.',
      items: mapBreakdownItems(breakdowns.sortUsage, SORT_LABELS),
    },
    {
      title: 'Síunotkun',
      helpText:
        'Sýnir hvaða síur eru notaðar oftast. Hvert gildi segir til um hversu margar leitir notuðu viðkomandi síu.',
      items: mapBreakdownItems(breakdowns.filterUsage, FILTER_LABELS),
    },
  ]
}

const mapQueryRows = (rows: SearchAnalyticsQueriesResponse['rows']) => {
  return rows.map((row) => ({
    normalizedQuery: row.normalizedQuery,
    count: row.count.toString(),
    zeroResultRate: formatPercent(row.zeroResultRate),
    avgDurationMs: formatDuration(row.avgDurationMs),
    resultBucket: row.resultBucket,
  }))
}

export const mapQueriesToTables = (queries: {
  top?: SearchAnalyticsQueriesResponse
  zeroResults?: SearchAnalyticsQueriesResponse
  slow?: SearchAnalyticsQueriesResponse
}): SearchDashboardQueryTableProps[] => {
  return [
    {
      title: 'Algengustu leitir',
      helpText:
        'Leitirnar sem koma oftast fyrir á valda tímabilinu. Taflan hjálpar við að sjá hvað notendur leita mest að.',
      columns: QUERY_TABLE_COLUMNS,
      rows: mapQueryRows(queries.top?.rows ?? []),
    },
    {
      title: 'Leitir án niðurstaðna',
      helpText:
        'Endurteknar leitir sem skila oft eða alltaf engum niðurstöðum. Þetta getur bent til efnisgaps eða veikrar samsvörunar í leitinni.',
      columns: QUERY_TABLE_COLUMNS,
      rows: mapQueryRows(queries.zeroResults?.rows ?? []),
    },
    {
      title: 'Hægustu endurteknu leitir',
      helpText:
        'Endurteknar leitir með hæsta meðalbiðtíma. Taflan hjálpar við að greina hvaða fyrirspurnir eru þyngstar eða hægast svaraðar.',
      columns: QUERY_TABLE_COLUMNS,
      rows: mapQueryRows(queries.slow?.rows ?? []),
    },
  ]
}
