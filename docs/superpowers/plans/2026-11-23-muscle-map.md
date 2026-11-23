# Kas Haritası Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Antrenman başında ve bitişinde büyük ön/arka kas haritası, Bugün/Sıradaki kartında küçük harita, hareket kartlarında kas etiketleri.

**Architecture:** Kas verisi katalogda (`muscles`), birleştirme saf fonksiyonlarda (`src/domain/muscles.ts`), çizim tek bir SVG bileşeninde (`BodyMap`) ve etiket bileşeninde (`MuscleChips`). Ekranlar sadece bunları çağırır.

**Tech Stack:** Mevcut: React 19, TypeScript, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-23-muscle-map-design.md` (ana tasarım: `2026-11-23-fitness-app-design.md`)

## Global Constraints

- Kas adları (Türkçe, aynen): Omuz, Göğüs, Biceps, Ön kol, Karın, Yan karın, Ön bacak, Trapez, Arka omuz, Üst sırt, Kanat, Bel, Triceps, Kalça, Arka bacak, Baldır.
- Ön görünüm bölgeleri: omuz, göğüs, biceps, ön kol, karın, yan karın, ön bacak. Arka: trapez, arka omuz, üst sırt, kanat, bel, triceps, ön kol, kalça, arka bacak, baldır. Baldır yalnız arkada.
- Renk: ana `#f97316`, yardımcı `#fdba74`; degrade kartta zemin yarı saydam beyaz. Kart etiketleri: ana turuncu, yardımcı gri.
- Metinler aynen: "Bugün çalışacak kasların 🔥", "N hareket · tüm vücut", "Bugün çalıştırdığın kaslar", "N set · M hareket ilerledi", ilerleme yoksa "Aynı hedeflerle devam".
- Görsel internetsiz çalışır (inline SVG, harici dosya yok).

## Review Focus

1. **Katalogda kası eksik ya da yanlış adlı hareket:** figür sessizce boş kalmamalı. → Task 1 katalog bütünlük testi.
2. **Bazı hareketleri yapılmadan bitirilen antrenman:** bitiş haritası yalnız set girilen hareketleri göstermeli. → Task 1 `sessionMuscles` testi.
3. **Güncellemeden önce açılmış eski oturumda katalogda olmayan hareket kimliği:** çökmemeli, yok sayılmalı. → Task 1 testi.
4. **Koyu tema:** degrade kart ve etiketler okunur kalmalı. → Task 4 görsel kontrol.
5. **Antrenman devam ederken Bugün ekranı:** "Antrenman devam ediyor" + o oturumun gününün kasları. → Task 4 testi.

---

### Task 1: Kas verisi ve birleştirme

**Files:** Modify `src/domain/types.ts`, `src/domain/catalog.ts`; Create `src/domain/muscles.ts`; Test `tests/domain/muscles.test.ts`

**Interfaces — Produces:**
```ts
type Muscle = 'shoulders' | 'chest' | 'biceps' | 'forearms' | 'abs' | 'obliques' | 'quads'
  | 'traps' | 'rearDelts' | 'upperBack' | 'lats' | 'lowerBack' | 'triceps' | 'glutes' | 'hamstrings' | 'calves';
interface MuscleSet { primary: Muscle[]; secondary: Muscle[] }
// ExerciseDef.muscles: MuscleSet
const MUSCLE_NAMES: Record<Muscle, string>;          // Global Constraints'teki Türkçe adlar
const FRONT_MUSCLES: Muscle[]; const BACK_MUSCLES: Muscle[];
function mergeMuscles(sets: MuscleSet[]): MuscleSet   // birleşim; yardımcı = yardımcılar − ana; ilk geçiş sırası
function dayMuscles(day: DayKey): MuscleSet
function sessionMuscles(s: Session): MuscleSet        // yalnız ≥1 set girilmiş, katalogda olan hareketler
function finishStats(s: Session, results: { event: ProgressEvent }[]): { sets: number; progressed: number }
```
Eşleşmeler spec tablosundan aynen (Pallof: Yan karın, Karın).

- [ ] **Step 1: Failing tests:** her katalog hareketinin ≥1 ana kası var ve tüm kaslar `MUSCLE_NAMES` anahtarı; barfiks `{primary:['lats','biceps'], secondary:['upperBack','rearDelts','forearms']}`; `FRONT_MUSCLES` 'calves' içermez, `BACK_MUSCLES` içerir; `dayMuscles('A').primary` = `['lats','biceps','chest','triceps','quads','glutes','hamstrings','abs','shoulders']`, yardımcıda ana kas yok; `sessionMuscles` sadece set girilen barfiks+şınav → primary `['lats','biceps','chest','triceps']`; bilinmeyen `exerciseId` yok sayılır; `finishStats` sets [6,6,null]+[10] → 3, olaylar reps-up, level-up, max-level, none → progressed 2.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS + `npm test`.
- [ ] **Step 5: Commit** `feat: hareketlerin çalıştırdığı kaslar`

### Task 2: BodyMap ve MuscleChips bileşenleri

**Files:** Create `src/components/BodyMap.tsx`, `src/components/MuscleChips.tsx`; Modify `src/styles.css`; Test `tests/components/BodyMap.test.tsx`

**Interfaces:**
- Consumes: Task 1.
- Produces: `BodyMap({ muscles: MuscleSet; size: number; tone?: 'onDark' | 'onLight' })` → ön ve arka iki `<svg role="img">`, altlarında "ÖN"/"ARKA" (size ≥ 120 iken). Her kas bölgesi `<g data-muscle=… data-state="primary|secondary|idle">`. `aria-label`: `"Ön: Göğüs, Omuz"` / `"Arka: Kanat"` (yalnız ana+yardımcı, ana önce; hiçbiri yoksa "Ön: çalışan kas yok"). `MuscleChips({ muscles: MuscleSet; showSecondary?: boolean })` → `<ul aria-label="Çalışan kaslar">`, ana `li.chip-p`, yardımcı `li.chip-s`.

- [ ] **Step 1: Failing tests:** barfiks kaslarıyla ön figür etiketi `"Ön: Biceps, Ön kol"`, arka figür `"Arka: Kanat, Üst sırt, Arka omuz, Ön kol"` (biceps yalnız önde çizilir); arka figürde `[data-muscle="lats"]` `data-state="primary"`; ön figürde `[data-muscle="calves"]` yok; chips: ana "Kanat", "Biceps" `chip-p`, `showSecondary=false` iken yardımcı yok.
- [ ] **Step 2:** FAIL → **Step 3:** uygula (bölge yolları önceki örnekteki çizimden; baldır yalnız arkada) → **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: kas haritası ve kas etiketi bileşenleri`

### Task 3: Antrenman ekranı

**Files:** Modify `src/screens/Workout.tsx`, `src/styles.css`; Test `tests/screens/Workout.test.tsx`

**Interfaces:** Consumes Task 1–2. `NextWorkoutCard({ day, active, onAction, actionLabel })` yeni bileşen (`src/components/NextWorkoutCard.tsx`): degrade kart, başlık, "N hareket · …", küçük `BodyMap` (size 90), düğme. Workout bekleme ekranı ve Today bunu kullanır.

- [ ] **Step 1: Failing tests:** aktif oturumda `heading "Bugün çalışacak kasların 🔥"` ve oturumdaki hareket sayısıyla `"2 hareket · tüm vücut"` (2 hareketlik test oturumu); harita günün katalogdaki tüm hareketlerinden (`dayMuscles`), sayı oturumdan; barfiks kartında "Kanat" etiketi; Bitir sonrası `heading "Bugün çalıştırdığın kaslar"`, `"3 set · 1 hareket ilerledi"` (pushup 10,10,10 hedef 10); ilerleme yoksa "Aynı hedeflerle devam"; bekleme ekranında "Sıradaki: Antrenman A" kartında `role="img"` figür.
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS + `npm test`.
- [ ] **Step 5: Commit** `feat: antrenmanda günün kas haritası ve bitiş özeti`

### Task 4: Bugün ekranı, görsel kontrol, yayın

**Files:** Modify `src/screens/Today.tsx`; Test `tests/screens/Today.test.tsx`; `scripts/smoke.mjs` (gerekirse)

- [ ] **Step 1: Failing tests:** Bugün kartı `NextWorkoutCard` ile "Sıradaki: Antrenman B (7 hareket)" + figür; aktif oturum varken "Antrenman devam ediyor" + o oturumun günü (B oturumu → figür etiketi B kaslarını içerir, örn. "Üst sırt").
- [ ] **Step 2:** FAIL → **Step 3:** uygula → **Step 4:** PASS + `npm test` (3 kez) + `npm run build`.
- [ ] **Step 5:** iPhone 13 ekran görüntüleri (açık + koyu): Bugün, antrenman başı, bitiş; taşma yok, konsol hatası yok; `npm run smoke` 16/16.
- [ ] **Step 6: Commit**, dal push, `main`'e ileri birleştirme + `npm test`, `main` push, yayın iş akışının başarısını doğrula.
