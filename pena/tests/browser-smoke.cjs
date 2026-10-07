const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const path = require('node:path');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') failures.push(message.text());
  });
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const desktop = path.resolve(__dirname, 'desktop.png');
  await page.screenshot({ path: desktop, fullPage: true });
  console.log(JSON.stringify({ title: await page.title(), desktop, failures }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.resolve(__dirname, 'mobile.png'), fullPage: true });
  console.log(JSON.stringify({ mobileOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }));
  await browser.close();
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
