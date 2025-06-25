import * as puppeteer from 'puppeteer'

export const getBrowser = async () => {
  const browers = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none',
      '--disable-gpu',
    ],
    headless: true,
    protocolTimeout: 300_000,
    executablePath:
      process.env.NODE_ENV === 'production'
        ? '/usr/bin/chromium-browser'
        : (process.env.LOCAL_CHROMIUM_PATH ??
          '/Applications/Chromium.app/Contents/MacOS/Chromium'),
  })
  return browers
}
