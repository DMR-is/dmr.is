import puppeteer from 'puppeteer'

export const getBrowser = async () => {
  const isProduction = process.env.NODE_ENV === 'production'

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--font-render-hinting=none',
    '--disable-gpu',
    ...(isProduction ? ['--disable-dev-shm-usage', '--no-zygote'] : []),
  ]

  const browser = await puppeteer.launch({
    args,
    headless: true,
    protocolTimeout: 300_000,
    executablePath: isProduction
      ? '/usr/bin/chromium-browser'
      : (process.env.LOCAL_CHROMIUM_PATH ??
        '/Applications/Chromium.app/Contents/MacOS/Chromium'),
  })
  return browser
}
