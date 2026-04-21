export const getBaseUrlFromServerSide = (includePrefix = false): string => {
  let url = ''
  if (process.env.NODE_ENV === 'development') {
    url = process.env.DOE_WEB_URL!
  } else {
    url = (process.env.BASE_URL ?? process.env.IDENTITY_SERVER_LOGOUT_URL)!
  }
  return includePrefix ? url : url.replace(/^https?:\/\//, '')
}
