// iPhone duman testi: derlenmiş uygulamayı iPhone 13 emülasyonunda baştan sona dener.
// Kullanım: npm run build && npx vite preview --port 4173 &  →  npm run smoke [URL] [çıktı-klasörü]
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

// Playwright proje bağımlılığı değil; ortamda kurulu olanı kullanır.
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const URL = process.argv[2] ?? 'http://localhost:4173/fitness/';
const OUT = process.argv[3] ?? 'smoke-out';
await mkdir(OUT, { recursive: true });

const failures = [];
const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failures.push(msg); };

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone 13'] });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('dialog', (d) => d.accept());

const noOverflow = async (where) => check(
  await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${where}: yatay taşma yok`);
/** Öğe 5 sn içinde görünür olursa true. */
const visible = (locator) => locator.waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false);
const tab = (name) => page.getByRole('navigation').getByRole('button', { name }).click();

// 1) Kurulum
await page.goto(URL);
for (const b of ['Sarı', 'Kırmızı', 'Siyah']) {
  await page.getByLabel('Bant adı').fill(b);
  await page.getByRole('button', { name: 'Ekle' }).click();
}
await page.getByRole('button', { name: 'İleri' }).click();
await page.getByLabel('Kademe sayısı').fill('10');
await page.getByRole('button', { name: 'İleri' }).click();
await page.getByLabel('Kalori (kcal)').fill('2200');
await page.getByLabel('Protein (g)').fill('160');
await page.getByLabel('Karbonhidrat (g)').fill('220');
await page.getByLabel('Yağ (g)').fill('70');
await page.getByRole('button', { name: 'Bitir' }).click();
check(await visible(page.getByText('Sıradaki: Antrenman A (7 hareket)')), 'kurulum sonrası Bugün ekranı açıldı');

// 2) Antrenman
await page.getByRole('button', { name: 'Başla', exact: true }).click();
await page.getByRole('heading', { name: 'Antrenman A' }).waitFor();
// Varsayılan: barfiks barı yok → barfiksin yerine bantlı eğilerek row.
await page.getByRole('button', { name: 'Bantlı eğilerek row (Kırmızı)' }).click();
for (const i of [1, 2, 3]) await page.getByRole('button', { name: `Bantlı eğilerek row set ${i}` }).click();
await page.getByLabel('Başlangıç seviyeni seç').first().selectOption({ label: 'Eğimli şınav – 6. kademe' });
for (const i of [1, 2, 3]) await page.getByRole('button', { name: `Şınav set ${i}` }).click();
await page.getByRole('button', { name: 'Bitir' }).click();
await page.getByRole('heading', { name: /Antrenman bitti/ }).waitFor();
check(await visible(page.locator('.result-row', { hasText: 'Bantlı eğilerek row' }).getByText('Sonraki sefer: 3×9')), 'bantlı row hedefi 8 → 9 tekrara çıktı');
await page.getByRole('button', { name: 'Tamam' }).click();

// 3) Öğün
await tab('Beslenme');
await page.getByRole('button', { name: '+ Öğün ekle' }).click();
await page.getByLabel('Ad (isteğe bağlı)').fill('Yulaf ezmesi');
await page.getByLabel('Kalori (kcal)').fill('420');
await page.getByLabel('Protein (g)').fill('22,5');
await page.getByRole('button', { name: 'Kaydet' }).click();
await page.getByText('420 / 2200 kcal').waitFor();

// 4) Yenile → veriler duruyor mu?
await page.reload();
await page.getByText('Sıradaki: Antrenman B (7 hareket)').waitFor();
check(await visible(page.getByText('420 / 2200 kcal')), 'yenilemeden sonra öğün duruyor');
check(await visible(page.getByText('22,5 / 160 g')), 'yenilemeden sonra protein (virgüllü) duruyor');
await tab('İlerleme');
await page.getByRole('button', { name: 'Bantlı eğilerek row' }).click();
check(await visible(page.getByRole('list', { name: 'Bantlı eğilerek row geçmişi' }).getByText('8, 8, 8')), 'bantlı row geçmişi kayıtlı');

// 5) Ekran görüntüleri: dört sekme × açık/koyu
for (const scheme of ['light', 'dark']) {
  await page.emulateMedia({ colorScheme: scheme });
  for (const [name, file] of [['Bugün', 'bugun'], ['Antrenman', 'antrenman'], ['Beslenme', 'beslenme'], ['İlerleme', 'ilerleme']]) {
    await tab(name);
    await page.waitForTimeout(400); // çubuk animasyonları
    await page.screenshot({ path: `${OUT}/${file}-${scheme}.png`, fullPage: true });
    await noOverflow(`${name} (${scheme})`);
  }
}

// 6) Çevrimdışı açılış
await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await page.reload(); // service worker sayfayı kontrol etsin
await page.getByRole('navigation').waitFor();
await context.setOffline(true);
await page.reload();
check(await visible(page.getByRole('navigation')), 'internet yokken uygulama açılıyor');
check(await visible(page.getByText('Sıradaki: Antrenman B (7 hareket)')), 'internet yokken veriler görünüyor');
await context.setOffline(false);

check(errors.length === 0, `konsol hatası yok${errors.length ? `: ${errors.join(' | ')}` : ''}`);
await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} kontrol başarısız.`);
  process.exit(1);
}
console.log(`\nTüm kontroller geçti. Ekran görüntüleri: ${OUT}/`);
