# Ev Fitness Uygulaması Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** iPhone'a ana ekrandan kurulan, internetsiz çalışan, kural tabanlı antrenman koçu + elle beslenme defteri olan kişisel bir PWA.

**Architecture:** Saf TypeScript domain modülleri (`src/domain/`: program, ilerleme, beslenme hesapları, özet metni) UI'dan bağımsızdır ve birim testlidir. Tüm kalıcı veri tek bir depolama modülünden (`src/data/`, Dexie/IndexedDB) geçer. React ekranları (`src/screens/`) sadece bu iki katmanı çağırır. GitHub Actions ile GitHub Pages'e yayınlanır.

**Tech Stack:** Vite, React 18, TypeScript, Dexie 4, vite-plugin-pwa, Vitest + @testing-library/react + fake-indexeddb, elle çizilen SVG grafik.

**Spec:** `docs/superpowers/specs/2026-11-23-fitness-app-design.md`

## Global Constraints

- Arayüz metinleri Türkçe. Kod tanımlayıcıları İngilizce (spec'teki Türkçe tablo adları: `ayarlar`→`settings`, `hareketDurumu`→`exerciseStates`, `oturumlar`→`sessions`, `öğünler`→`meals`, `ölçümler`→`measurements`).
- Sunucu yok, ağ çağrısı yok. Tüm veri IndexedDB'de. Tüm DB erişimi `src/data/repo.ts` üzerinden.
- Vite `base: '/fitness/'` (yayın adresi `https://drsntrkemin.github.io/fitness/`).
- Mobil öncelikli, iPhone genişliği (375–430 px). Dokunma hedefleri ≥ 44 px. Açık/koyu tema `prefers-color-scheme`'i izler.
- Alt sekmeler: **Bugün · Antrenman · Beslenme · İlerleme**. Ayarlar Bugün'deki ⚙ ikonundan açılır.
- Set kaydı tek dokunuş; öğün ekleme ≤ 4 dokunuş.
- Tarihler her zaman **yerel** gün anahtarıyla saklanır (`YYYY-MM-DD`, `localDateKey`), asla `toISOString()` ile değil.
- Her commit öncesi `npm test` ve `npm run build` geçer.

## Review Focus

1. **Gece yarısı / saat dilimi:** Türkiye UTC+3; 00:00–03:00 arası girilen öğün UTC ile önceki güne düşer. Beklenen: girildiği yerel güne yazılır. → Task 2 `localDateKey` testi.
2. **Ondalık virgül:** iPhone Türkçe klavyesi `72,5` üretir. Beklenen: 72.5 olarak kaydedilir; boş/geçersiz giriş kaydı engeller. → Task 2 `parseDecimal` testi.
3. **Ekipman değişince seviye taşması:** Kullanıcı sonradan bant silerse mevcut `level` merdiven uzunluğunu aşar. Beklenen: en üst geçerli seviyeye sıkıştırılır, uygulama çökmez. → Task 3 `clampLevel` testi.
4. **Bozuk/yanlış yedek dosyası:** Geri yüklemede alakasız JSON ya da yarım dosya. Beklenen: hata mesajı, mevcut veriye dokunulmaz. → Task 6 `importAll` testi.
5. **Yarım kalan antrenman:** Uygulama oturum ortasında kapanır, ertesi gün açılır. Beklenen: devam eden oturum kaldığı yerden açılır; yeni oturum başlatılmaz. → Task 6 `getActiveSession` testi ve Task 9 ekran testi.

---

## Dosya yapısı

```
index.html
vite.config.ts                 # base, PWA manifest, vitest ayarı
.github/workflows/deploy.yml   # Pages yayını
public/icon-192.png, icon-512.png, apple-touch-icon.png
src/
  main.tsx, App.tsx, styles.css
  domain/
    types.ts         # tüm paylaşılan tipler
    dates.ts         # localDateKey, addDays, daysBetween
    parse.ts         # parseDecimal
    catalog.ts       # hareket tanımları (veri)
    program.ts       # buildLadder, clampLevel, setsFor, nextDay
    progression.ts   # progress (çift aşamalı ilerleme)
    nutrition.ts     # dayTotals, frequentMeals, averages
    summary.ts       # buildClaudeSummary
  data/
    db.ts            # Dexie şeması
    repo.ts          # tüm okuma/yazma
    backup.ts        # exportAll, importAll, BackupError
  platform/
    ios.ts           # isStandalone, requestPersist, shareFile, copyText
  screens/
    Setup.tsx, Today.tsx, Workout.tsx, Nutrition.tsx, Progress.tsx, Settings.tsx
  components/
    TabBar.tsx, ProgressBar.tsx, LineChart.tsx, MealForm.tsx, SetInput.tsx
tests/ (src ile aynı yapıda *.test.ts[x])
```

---

### Task 1: Proje iskeleti, PWA ve yayın hattı

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `tests/setup.ts`, `tests/App.test.tsx`, `.github/workflows/deploy.yml`, `public/` ikonları, `.gitignore`

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run build`, `npm run dev`. `App` varsayılan export.

- [ ] **Step 1:** `npm create vite@latest . -- --template react-ts` eşdeğeri dosyaları oluştur; ekle: `dexie`, `vite-plugin-pwa`, dev: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `fake-indexeddb`. `tests/setup.ts` içinde `import 'fake-indexeddb/auto'` ve jest-dom.
- [ ] **Step 2: Failing test** `tests/App.test.tsx`: `render(<App />)` sonrası `screen.getByRole('navigation')` içinde "Bugün", "Antrenman", "Beslenme", "İlerleme" metinleri var.
- [ ] **Step 3:** `npx vitest run tests/App.test.tsx` → FAIL.
- [ ] **Step 4:** `App` içinde geçici `TabBar` (4 buton, `nav` elemanı) ve boş ekran yer tutucuları. `vite.config.ts`: `base: '/fitness/'`, `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Ev Fitness', short_name: 'Fitness', lang: 'tr', display: 'standalone', start_url: '/fitness/', scope: '/fitness/', theme_color, background_color, icons } })`. `index.html`: `lang="tr"`, `viewport-fit=cover`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`. İkonlar basit bir SVG'den üretilmiş PNG'ler (sharp ya da Playwright ile bir kerelik).
- [ ] **Step 5:** `npm test` ve `npm run build` → PASS; `dist/manifest.webmanifest` ve `dist/sw.js` var.
- [ ] **Step 6:** `.github/workflows/deploy.yml`: `main` push'ta ve `workflow_dispatch` ile; `actions/checkout`, `actions/setup-node` (20), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact` (`dist`), `actions/deploy-pages`. İzinler `pages: write`, `id-token: write`.
- [ ] **Step 7: Commit** `chore: Vite + React + PWA iskeleti ve Pages yayını`

### Task 2: Tarih ve sayı yardımcıları

**Files:** Create `src/domain/types.ts` (ilk tipler), `src/domain/dates.ts`, `src/domain/parse.ts`; Test `tests/domain/dates.test.ts`, `tests/domain/parse.test.ts`

**Interfaces:**
- Produces: `localDateKey(d: Date): string`, `addDays(key: string, n: number): string`, `daysBetween(a: string, b: string): number` (b − a, gün), `parseDecimal(s: string): number | null`, `type DateKey = string`.

- [ ] **Step 1: Failing tests**
  - `localDateKey(new Date(2026, 10, 24, 1, 30))` → `'2026-11-24'` (yerel 01:30; TZ testi için `process.env.TZ = 'Europe/Istanbul'` vitest config `env`'de).
  - `addDays('2026-02-28', 1)` → `'2026-03-01'`; `addDays('2026-11-23', -7)` → `'2026-11-16'`.
  - `daysBetween('2026-11-16', '2026-11-23')` → `7`.
  - `parseDecimal('72,5')` → `72.5`; `'72.5'` → `72.5`; `' 80 '` → `80`; `''` → `null`; `'abc'` → `null`; `'-3'` → `null` (negatif kabul edilmez).
- [ ] **Step 2:** Çalıştır → FAIL.
- [ ] **Step 3:** Uygula. `addDays`/`daysBetween` yerel öğlen (12:00) üzerinden `Date` ile hesaplar (DST güvenli).
- [ ] **Step 4:** Çalıştır → PASS.
- [ ] **Step 5: Commit** `feat: yerel tarih anahtarı ve ondalık virgül ayrıştırma`

### Task 3: Hareket kataloğu ve zorluk merdivenleri

**Files:** Modify `src/domain/types.ts`; Create `src/domain/catalog.ts`, `src/domain/program.ts`; Test `tests/domain/program.test.ts`

**Interfaces:**
- Produces (types.ts):
  ```ts
  type DayKey = 'A' | 'B';
  interface Band { id: string; name: string }            // dizi sırası: hafiften ağıra
  interface Equipment { bands: Band[]; ladderRungs: number } // 1 = en alt kademe
  type Stage =
    | { kind: 'fixed'; label: string }
    | { kind: 'bands'; label: string; reversed?: boolean }  // label içinde {band}
    | { kind: 'rungs'; label: string; order: 'desc' | 'asc' }; // label içinde {rung}
  interface ExerciseDef { id: string; name: string; day: DayKey; repMin: number; repMax: number;
    perSide?: boolean; core?: boolean; stages: Stage[]; howTo: string }
  interface ExerciseOverride { repMin?: number; repMax?: number; sets?: number }
  ```
- Produces (catalog.ts): `EXERCISES: ExerciseDef[]` (spec §6.2'deki 10 hareket, sırasıyla). id'ler: `pullup, pushup, band-squat, band-rdl, hanging-raise` (A); `inverted-row, band-press, band-lunge, band-hip-thrust, band-pallof` (B). Barfiks 4–8, diğerleri 8–12. `perSide`: lunge, pallof. `core`: hanging-raise, band-pallof. Her birine 1–2 cümle Türkçe `howTo`.
  - pullup stages: `fixed 'Negatif barfiks (yavaş iniş)'`, `bands 'Bant destekli ({band})' reversed`, `fixed 'Tam barfiks'`, `fixed 'Yavaş tempolu barfiks (3 sn iniş)'`.
  - pushup: `rungs 'Eğimli şınav – {rung}. kademe' desc`, `fixed 'Yer şınavı'`, `rungs 'Ayaklar merdivende – {rung}. kademe' asc`.
  - inverted-row: `rungs 'Ters row – {rung}. kademe' desc`. band-lunge: `fixed 'Geri lunge (vücut ağırlığı)'`, `bands 'Bantlı geri lunge ({band})'`. hanging-raise: `fixed 'Asılı diz çekme'`, `fixed 'Asılı düz bacak kaldırma'`. Diğer bantlı hareketler: tek `bands` aşaması.
- Produces (program.ts):
  - `buildLadder(ex: ExerciseDef, eq: Equipment): string[]` — aşamaları sırayla açar; `bands` → her bant bir seviye (`reversed` ise ağırdan hafife); `rungs desc` → `ladderRungs..1`, `asc` → `1..ladderRungs`. Sonuç boşsa `['Vücut ağırlığı']`.
  - `clampLevel(level: number, ladderLength: number): number`
  - `setsFor(ex: ExerciseDef, daysPerWeek: 2 | 3, override?: ExerciseOverride): number` — override varsa o; yoksa `daysPerWeek === 2 && !ex.core ? 4 : 3`.
  - `repRange(ex: ExerciseDef, override?: ExerciseOverride): { repMin: number; repMax: number }`
  - `exercisesFor(day: DayKey): ExerciseDef[]`
  - `nextDay(lastFinished: DayKey | null): DayKey` — `null`/`'B'` → `'A'`, `'A'` → `'B'`.

- [ ] **Step 1: Failing tests** (eq = 3 bant Sarı/Kırmızı/Siyah, 5 kademe):
  - `buildLadder(pullup)` → `['Negatif barfiks (yavaş iniş)', 'Bant destekli (Siyah)', 'Bant destekli (Kırmızı)', 'Bant destekli (Sarı)', 'Tam barfiks', 'Yavaş tempolu barfiks (3 sn iniş)']`.
  - `buildLadder(pushup)` uzunluğu `5 + 1 + 5 = 11`; ilk `'Eğimli şınav – 5. kademe'`, 6. `'Yer şınavı'`, son `'Ayaklar merdivende – 5. kademe'`.
  - `buildLadder(band-squat, {bands: [], ladderRungs: 5})` → `['Vücut ağırlığı']`.
  - `clampLevel(7, 3)` → `2`; `clampLevel(-1, 3)` → `0`.
  - `setsFor(band-squat, 2)` → 4; `setsFor(band-pallof, 2)` → 3; `setsFor(band-squat, 3)` → 3; override `{sets: 5}` → 5.
  - `exercisesFor('A').map(e => e.id)` → A listesi sırasıyla; `nextDay('A')` → `'B'`, `nextDay(null)` → `'A'`.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: hareket kataloğu ve ekipmandan merdiven üretimi`

### Task 4: İlerleme kuralı

**Files:** Modify `src/domain/types.ts`; Create `src/domain/progression.ts`; Test `tests/domain/progression.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface ExerciseState { level: number; targetReps: number; failStreak: number }
  type ProgressEvent = 'none' | 'reps-up' | 'level-up' | 'level-down' | 'max-level' | 'skipped';
  function progress(state: ExerciseState, sets: (number | null)[],
    range: { repMin: number; repMax: number }, ladderLength: number):
    { state: ExerciseState; event: ProgressEvent }
  function initialState(level: number, repMin: number): ExerciseState // failStreak 0
  ```
- Kurallar spec §6.3. Netleştirmeler: `null` set = yapılmadı. Tüm setler `null` → `skipped`, durum aynı. "Tüm setlerde hedef" için `null` set başarısızdır. `failStreak`, doldurulmuş herhangi bir set `repMin` altındaysa +1, değilse 0'lanır; 2'ye ulaşınca geri düşme (level > 0 ise; level 0'da sadece failStreak 0'lanır, event `none`). Seviye atlama/düşmede failStreak 0.

- [ ] **Step 1: Failing tests** (range 8–12, ladderLength 4):
  - `{level:1,targetReps:10}` + `[10,10,11]` → `{level:1,targetReps:11}`, `reps-up`.
  - `{level:1,targetReps:12}` + `[12,12,12]` → `{level:2,targetReps:8}`, `level-up`.
  - `{level:3,targetReps:12}` + `[12,12,12]` → `{level:3,targetReps:12}`, `max-level`.
  - `{level:1,targetReps:10}` + `[10,9,10]` → hedef aynı, `none`.
  - `[10,null,10]` hedef 10 → `none` (yarım set başarısız sayılır).
  - `[null,null,null]` → `skipped`, durum birebir aynı.
  - `{level:2,targetReps:8,failStreak:0}` + `[7,6,6]` → failStreak 1, `none`; ardından tekrar `[7,7,6]` → `{level:1,targetReps:10,failStreak:0}`, `level-down`.
  - `{level:0,targetReps:8,failStreak:1}` + `[5,5,5]` → `{level:0,targetReps:8,failStreak:0}`, `none`.
- [ ] **Step 2:** FAIL → **Step 3:** uygula (saf fonksiyon) → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: çift aşamalı ilerleme kuralı`

### Task 5: Beslenme hesapları

**Files:** Modify `src/domain/types.ts`; Create `src/domain/nutrition.ts`; Test `tests/domain/nutrition.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface Macros { kcal: number; protein: number; carbs: number; fat: number }
  interface Meal extends Macros { id?: number; date: DateKey; time: string /* 'HH:MM' */; name: string }
  function dayTotals(meals: Meal[]): Macros
  function frequentMeals(meals: Meal[], limit = 8): (Macros & { name: string })[]
  function averages(meals: Meal[], from: DateKey, to: DateKey): { avg: Macros; loggedDays: number }
  ```
- `frequentMeals`: boş adlı öğünler hariç; anahtar `name.trim().toLocaleLowerCase('tr') + değerler`; sıralama sayı azalan, eşitlikte en son tarih önce. `averages`: sadece en az bir öğün girilmiş günler (`from..to` dahil) ortalamaya katılır; hiç yoksa `avg` sıfır, `loggedDays` 0. Değerler tam sayıya yuvarlanır.

- [ ] **Step 1: Failing tests:** iki öğünlü gün toplamı; aynı "Yulaf" 3 kez + "Yumurta" 1 kez → ilk eleman Yulaf; adı boş öğün listede yok; `"YULAF"` ve `"yulaf"` aynı grup; 7 günlük aralıkta 2 gün kayıt (2000 ve 1800 kcal) → `avg.kcal 1900`, `loggedDays 2`; aralık dışı öğün sayılmaz.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: beslenme toplamları, sık öğünler, ortalamalar`

### Task 6: Veritabanı, depo ve yedekleme

**Files:** Create `src/data/db.ts`, `src/data/repo.ts`, `src/data/backup.ts`; Modify `src/domain/types.ts`; Test `tests/data/repo.test.ts`, `tests/data/backup.test.ts`

**Interfaces:**
- Produces (types.ts):
  ```ts
  interface Targets extends Macros {}
  interface Settings { targets: Targets | null; daysPerWeek: 2 | 3; equipment: Equipment;
    overrides: Record<string, ExerciseOverride>; lastBackup: DateKey | null; setupDone: boolean }
  interface SessionExercise { exerciseId: string; level: number; levelLabel: string; targetReps: number; sets: (number | null)[] }
  interface Session { id?: number; date: DateKey; day: DayKey; status: 'active' | 'done'; exercises: SessionExercise[] }
  interface Measurement { date: DateKey; weight: number | null; waist: number | null }
  interface BackupFile { app: 'ev-fitness'; version: 1; exportedAt: string; settings: Settings;
    exerciseStates: Record<string, ExerciseState>; sessions: Session[]; meals: Meal[]; measurements: Measurement[] }
  ```
- Produces (repo.ts), hepsi `Promise` döner:
  `getSettings(): Settings` (yoksa `DEFAULT_SETTINGS`: targets null, daysPerWeek 3, bands [], ladderRungs 10, overrides {}, lastBackup null, setupDone false), `saveSettings(s)`,
  `getExerciseStates(): Record<string, ExerciseState>`, `putExerciseStates(states: Record<string, ExerciseState>)`,
  `getActiveSession(): Session | undefined`, `saveSession(s: Session): number`, `listSessions(fromDate?: DateKey): Session[]` (tarih azalan, sadece `done`), `lastFinishedDay(): DayKey | null`,
  `addMeal(m: Meal): number`, `updateMeal(m: Meal)`, `deleteMeal(id: number)`, `listMeals(from: DateKey, to: DateKey): Meal[]`, `allMeals(): Meal[]`,
  `putMeasurement(m: Measurement)` (aynı tarih varsa üzerine yazar), `listMeasurements(): Measurement[]` (tarih artan),
  `resetAll()`.
- Produces (backup.ts): `exportAll(): Promise<BackupFile>`, `importAll(data: unknown): Promise<void>`, `class BackupError extends Error`, `requestPersist` değil (platform'da).
- Dexie şeması v1: `settings: 'key'` (tek satır `key:'main'`), `exerciseStates: 'id'`, `sessions: '++id, date, status'`, `meals: '++id, date'`, `measurements: 'date'`.
- `importAll`: önce doğrular (`app === 'ev-fitness'`, `version === 1`, tüm diziler mevcut ve dizi); başarısızsa `BackupError('Geçersiz yedek dosyası')` fırlatır ve DB'ye dokunmaz. Geçerliyse tek bir Dexie transaction'ında tabloları temizleyip yazar.

- [ ] **Step 1: Failing tests (repo):** boş DB'de `getSettings()` → `DEFAULT_SETTINGS`; `saveSession({status:'active'})` sonrası `getActiveSession()` aynı oturumu döner (yarım antrenman — Review Focus 5); `status:'done'` olunca `getActiveSession()` undefined ve `lastFinishedDay()` o günün `day`'i; `listMeals('2026-11-23','2026-11-23')` sadece o günü döner; aynı tarihe iki kez `putMeasurement` → tek kayıt, son değer.
- [ ] **Step 2: Failing tests (backup):** veri ekle → `exportAll()` → `resetAll()` → `importAll(export)` → tüm tablolar eşit; `importAll({foo:1})` → `BackupError` ve önceden eklenen öğün hâlâ duruyor (Review Focus 4); `version: 2` → `BackupError`.
- [ ] **Step 3:** FAIL → **Step 4:** uygula → **Step 5:** PASS.
- [ ] **Step 6: Commit** `feat: IndexedDB deposu ve yedekle/geri yükle`

### Task 7: "Claude'a sor" özeti

**Files:** Create `src/domain/summary.ts`; Test `tests/domain/summary.test.ts`

**Interfaces:**
- Consumes: `averages` (Task 5), `buildLadder` (Task 3), tipler.
- Produces:
  ```ts
  interface SummaryInput { today: DateKey; settings: Settings; states: Record<string, ExerciseState>;
    sessions: Session[]; meals: Meal[]; measurements: Measurement[] }
  function buildClaudeSummary(input: SummaryInput): string
  ```
- Metin bölümleri ve başlıkları (sırasıyla, spec §6.5): `Hedefim: kas kazanmak, genel güç, yağ oranını azaltmak (rekompozisyon).` / `Ekipman:` (bant adları hafiften ağıra, kademe sayısı, barfiks barı) / `Haftada X gün tüm vücut A/B programı.` / `## Son 14 günün antrenmanları` (her oturum: `2026-11-20 (A): Barfiks – Bant destekli (Kırmızı): 6, 6, 5; ...`; `null` setler `–`) / `## Hareketlerin şu anki seviyesi` / `## Beslenme (son 14 gün, kayıt girilen N gün ortalaması)` (`Kalori 1950 / hedef 2200 kcal` vb.; hedef yoksa `hedef girilmedi`) / `## Kilo ve bel (son 4 hafta)` / son satır: `Bu verilere bakarak programımı ve beslenmemi nasıl ayarlamalıyım?`
- Veri olmayan bölümde `Kayıt yok.` yazılır.

- [ ] **Step 1: Failing tests:** örnek veriyle metin `'## Son 14 günün antrenmanları'` ve `'Barfiks – Bant destekli (Kırmızı): 6, 6, 5'` içerir; 15 gün önceki oturum metinde yok; hiç öğün yokken `'Kayıt yok.'` beslenme bölümünde; son satır sabit soru.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: Claude'a sor özet metni`

### Task 8: Uygulama kabuğu, kurulum ve ayarlar

**Files:** Create `src/screens/Setup.tsx`, `src/screens/Settings.tsx`, `src/components/TabBar.tsx`, `src/platform/ios.ts`; Modify `src/App.tsx`, `src/styles.css`; Test `tests/screens/Setup.test.tsx`, `tests/screens/Settings.test.tsx`

**Interfaces:**
- Consumes: repo (Task 6), backup (Task 6), `parseDecimal` (Task 2).
- Produces (ios.ts): `isStandalone(): boolean` (`navigator.standalone === true` veya `matchMedia('(display-mode: standalone)')`), `requestPersist(): Promise<void>`, `shareFile(name: string, text: string): Promise<'shared' | 'downloaded'>` (`navigator.canShare({files})` varsa `navigator.share`, yoksa `<a download>`), `copyText(text: string): Promise<boolean>`.
- `App`: açılışta `getSettings()`; `setupDone` false ise `Setup`; değilse sekmeler + aktif ekran. Ayarlar overlay ekranı olarak açılır. Açılışta bir kez `requestPersist()`.
- **Setup** 3 adım (spec §6.1): (1) bant ekle/sil/yukarı-aşağı sırala (en az 0 bant geçerli); (2) kademe sayısı (1–30, varsayılan 10); (3) kcal/protein/karb/yağ — "Atla" ile `targets: null`. Bitir → `saveSettings({...setupDone:true})`.
- **Settings**: hedefler; gün sayısı 3/2; bant ve kademe düzenleme (Setup bileşenlerini yeniden kullanır); hareket bazında set sayısı ve tekrar aralığı (repMin < repMax doğrulaması); "Yedekle" (`exportAll` → `shareFile('ev-fitness-YYYY-MM-DD.json', ...)` → `lastBackup` güncelle); "Geri yükle" (dosya seç → `confirm('Mevcut verilerin yerine yedek yüklensin mi?')` → `importAll`, hata olursa mesaj); son yedek tarihi; "Verileri sıfırla" (iki kez onay).

- [ ] **Step 1: Failing tests:** Setup'ta "Kırmızı" bant ekle, kademe 8, hedeflerde "Atla" → `getSettings()` `bands[0].name === 'Kırmızı'`, `ladderRungs 8`, `targets null`, `setupDone true`; Settings'te protein alanına `'160'` yaz, kaydet → `targets.protein 160`; geri yüklemede geçersiz dosya → "Geçersiz yedek dosyası" metni görünür.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: kurulum sihirbazı, ayarlar ve yedekleme arayüzü`

### Task 9: Antrenman ekranı

**Files:** Create `src/screens/Workout.tsx`, `src/components/SetInput.tsx`, `src/domain/session.ts`; Test `tests/domain/session.test.ts`, `tests/screens/Workout.test.tsx`

**Interfaces:**
- Consumes: Task 3 (`exercisesFor`, `buildLadder`, `clampLevel`, `setsFor`, `repRange`, `nextDay`), Task 4 (`progress`, `initialState`), Task 6 repo.
- Produces (session.ts):
  ```ts
  function createSession(day: DayKey, date: DateKey, settings: Settings,
    states: Record<string, ExerciseState>): Session   // durumu olmayan harekette level -1 (başlangıç seçilecek)
  function finishSession(session: Session, settings: Settings, states: Record<string, ExerciseState>):
    { states: Record<string, ExerciseState>; results: { exerciseId: string; event: ProgressEvent; message: string }[] }
  ```
  `createSession` her hareket için `level = clampLevel(state.level, ladder.length)` kullanır (Review Focus 3), `sets` uzunluğu `setsFor`, değerler `null`. `finishSession` mesajları: `reps-up` → `'Sonraki sefer: {sets}×{target}'`, `level-up` → `'Yeni seviye: {label} 🎉'`, `level-down` → `'Bir seviye geri: {label}'`, `max-level` → `'En üst seviyedesin'`, `none` → `'Aynı hedefle devam'`, `skipped` → `'Yapılmadı'`.
- Ekran davranışı (spec §6.1): Aktif oturum varsa onu açar, yoksa "Sıradaki: Antrenman {nextDay}" + Başla, altında her hareketin mevcut seviye etiketi ve hedefi (`3 × 10`, seçilmemişse "Seviye seçilmedi") ve son 5 oturumun listesi (tarih, gün). Level −1 olan harekette "Başlangıç seviyeni seç" listesi (merdiven etiketleri) gösterilir; seçince `initialState`. Set kutusu: boşken hedef sayıyı soluk gösterir; tek dokunuş = hedefi yaz; dolu kutuya dokunmak +/− stepper açar. Her değişiklik `saveSession` ile anında kaydedilir. Hareket başlığında ⓘ `howTo`, "Seviyeyi değiştir" (elle seviye → `targetReps = repMin`). "Bitir" → `finishSession` → `putExerciseStates` → `status:'done'` → sonuç özeti.

- [ ] **Step 1: Failing tests (session):** durum `{level:1,targetReps:10}` ile oluşturulan oturumda tüm setler 10 → `finishSession` state targetReps 11 ve mesaj `'Sonraki sefer: 3×11'`; bant silinmiş (ladder 2) ve state level 5 → `createSession` level 1; durumu olmayan hareket level −1.
- [ ] **Step 2: Failing tests (ekran):** aktif oturum DB'deyken ekran açılınca "Başla" değil oturum görünür (Review Focus 5); bir set kutusuna dokununca değer hedef sayısı olur ve DB'deki oturumda kayıtlı.
- [ ] **Step 3:** FAIL → **Step 4:** uygula → **Step 5:** PASS.
- [ ] **Step 6: Commit** `feat: antrenman kaydı ve otomatik ilerleme`

### Task 10: Beslenme ekranı

**Files:** Create `src/screens/Nutrition.tsx`, `src/components/MealForm.tsx`, `src/components/ProgressBar.tsx`; Test `tests/screens/Nutrition.test.tsx`

**Interfaces:**
- Consumes: Task 5 (`dayTotals`, `frequentMeals`), Task 6 repo, `parseDecimal`, `localDateKey`.
- Produces: `MealForm` props `{ initial?: Meal; date: DateKey; onSaved(): void }`; `ProgressBar` props `{ label: string; value: number; target: number | null; unit: string }` (hedef yoksa sadece değer).
- Ekran: gün seçici (◀ bugün ▶), toplamlar (kcal ve protein büyük çubuk, karb/yağ küçük satır), öğün listesi (dokun → düzenle, sola kaydır ya da düzenlemede "Sil"), "+ Öğün ekle". Form: ad (opsiyonel), kcal, protein, karb, yağ — `inputMode="decimal"`; kcal zorunlu, diğer boşlar 0; geçersiz sayı alanı kırmızı ve kaydet pasif. Formun üstünde `frequentMeals` çipleri: dokununca seçili güne o değerlerle eklenir (2 dokunuş). Saat = ekleme anı `HH:MM`.

- [ ] **Step 1: Failing tests:** forma `kcal '450'`, `protein '32,5'` gir, kaydet → listede öğün ve toplam protein `32.5`; daha önce "Yulaf" girilmişken çipe dokun → bugüne ikinci "Yulaf" eklenir; kcal boşken kaydet butonu pasif.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: beslenme defteri ekranı`

### Task 11: Bugün ekranı

**Files:** Create `src/screens/Today.tsx`; Test `tests/screens/Today.test.tsx`

**Interfaces:**
- Consumes: repo, `nextDay`, `dayTotals`, `ProgressBar`, `MealForm`, `buildClaudeSummary`, `copyText`, `daysBetween`.
- Ekran (spec §6.1 çizimi): tarih başlığı (`tr-TR` uzun format) + ⚙; antrenman kartı (aktif oturum varsa "Devam et", yoksa "Sıradaki: Antrenman X (N hareket)" + Başla → Antrenman sekmesine geçer); bu hafta (Pzt–Paz) tamamlanan oturum sayısı `2 / 3`; kalori ve protein çubukları, karb/yağ satırı; "+ Öğün ekle" (MealForm alt sayfa); son ölçümden ≥ 7 gün geçtiyse ya da hiç yoksa ölçüm kartı (kilo, bel — `parseDecimal`, ikisinden biri yeterli); `lastBackup` null ve en az 1 kayıt varsa ya da ≥ 30 gün geçtiyse "Yedek alma zamanı" bağlantısı (Ayarlar'a); "Claude'a sor" → özet → `copyText` → "Kopyalandı ✓ — claude.ai'yi aç" bağlantısı (`https://claude.ai/new`).
- Uygulama Safari'de (standalone değil) açıksa üstte kapatılabilir bant: "Paylaş ⬆︎ → Ana Ekrana Ekle ile kur. Veriler ana ekran uygulamasında ayrı saklanır."

- [ ] **Step 1: Failing tests:** 8 gün önce ölçüm varken ölçüm kartı görünür, 2 gün önce varken görünmez; ölçüm kartına `'78,4'` girince `listMeasurements()` son kaydı `weight 78.4`; "Claude'a sor"a basınca `navigator.clipboard.writeText` (mock) özet metniyle çağrılır ve "Kopyalandı" görünür.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: Bugün ekranı, haftalık ölçüm ve Claude'a sor`

### Task 12: İlerleme ekranı

**Files:** Create `src/screens/Progress.tsx`, `src/components/LineChart.tsx`; Test `tests/screens/Progress.test.tsx`

**Interfaces:**
- Consumes: repo, `averages`, `EXERCISES`.
- Produces: `LineChart` props `{ points: { date: DateKey; value: number }[]; unit: string }` — SVG, `currentColor`/CSS değişkenleri, < 2 noktada "Grafik için en az 2 ölçüm gerekli".
- Ekran: kilo ve bel grafikleri (ilk ve son değer, fark `−1,2 kg` biçiminde, `tr-TR` sayı formatı); 7/30 gün sekmeli ortalama kcal/protein/karb/yağ, hedefle ve "N gün kayıt" notuyla; hareket listesi → dokununca o hareketin geçmişi (tarih, seviye etiketi, setler).

- [ ] **Step 1: Failing tests:** iki ölçüm (80, 78.8) → `'−1,2 kg'` metni; tek ölçümde uyarı metni; bir oturumdaki barfiks setleri hareket geçmişinde `6, 6, 5` olarak görünür.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: İlerleme ekranı`

### Task 13: iPhone doğrulaması ve yayın

**Files:** Modify gerektiği kadar stil dosyaları; Create `scripts/smoke.mjs` (Playwright, iPhone 13 emülasyonu)

- [ ] **Step 1:** `npm run build && npx vite preview --base /fitness/` üzerinde `scripts/smoke.mjs`: kurulumu tamamla → antrenman başlat, bir hareket için başlangıç seviyesi seç, setleri dokunarak doldur, bitir → bir öğün ekle → sayfayı yenile → verilerin durduğunu doğrula → ekran görüntüsü (Bugün, Antrenman, Beslenme, İlerleme; açık ve koyu tema). Yatay taşma yok (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] **Step 2:** Çevrimdışı: service worker kurulduktan sonra `context.setOffline(true)` ile yenile → uygulama açılır.
- [ ] **Step 3:** Ekran görüntülerini incele, düzeltmeleri yap, `npm test` + `npm run build` PASS.
- [ ] **Step 4: Commit** `chore: iPhone duman testi ve görsel düzeltmeler`
- [ ] **Step 5:** Dalı push et. Kullanıcıya iki tek seferlik adımı ilet: (1) repo Settings → General → Change visibility → Public; (2) Settings → Pages → Source: GitHub Actions; sonra PR'ı `main`'e merge etmek yayını tetikler. iPhone kurulum talimatı: Safari'de `https://drsntrkemin.github.io/fitness/` → Paylaş → Ana Ekrana Ekle.
