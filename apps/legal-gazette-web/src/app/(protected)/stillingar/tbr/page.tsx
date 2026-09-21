import { TBRSettingsContainer } from '../../../../containers/TBRSettingsContainer'

// No prefetch here on purpose. The container queries `getTbrSettings` with its
// own paging and filter defaults, which never matched the empty input this page
// used to prefetch, and the page renders no `HydrateClient`, so nothing was
// dehydrated either. Reviving it means aligning the input, adding
// `HydrateClient`, awaiting, and pinning the timezone of the dates
// `TBRSettingInfo` renders.
export default function TBRSettingsPage() {
  return <TBRSettingsContainer />
}
