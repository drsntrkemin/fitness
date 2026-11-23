import { buildClaudeSummary, type SummaryInput } from '../../src/domain/summary';
import type { Settings } from '../../src/domain/types';

const settings: Settings = {
  targets: { kcal: 2200, protein: 160, carbs: 220, fat: 70 },
  daysPerWeek: 3,
  equipment: { bands: [{ id: 'b1', name: 'Sarı' }, { id: 'b2', name: 'Kırmızı' }], ladderRungs: 10 },
  overrides: {}, lastBackup: null, setupDone: true,
};

const input = (over: Partial<SummaryInput> = {}): SummaryInput => ({
  today: '2026-11-23',
  settings,
  states: { pullup: { level: 2, targetReps: 6, failStreak: 0 } },
  sessions: [
    { id: 1, date: '2026-11-20', day: 'A', status: 'done', exercises: [
      { exerciseId: 'pullup', level: 1, levelLabel: 'Bant destekli (Kırmızı)', targetReps: 6, sets: [6, 6, 5] },
      { exerciseId: 'pushup', level: 3, levelLabel: 'Eğimli şınav – 7. kademe', targetReps: 10, sets: [10, null, 9] },
    ] },
    { id: 2, date: '2026-11-08', day: 'B', status: 'done', exercises: [
      { exerciseId: 'inverted-row', level: 0, levelLabel: 'Ters row – 10. kademe', targetReps: 8, sets: [8, 8, 8] },
    ] },
    { id: 3, date: '2026-11-10', day: 'A', status: 'done', exercises: [
      { exerciseId: 'band-squat', level: 0, levelLabel: 'Bantlı squat (Sarı)', targetReps: 9, sets: [9, 9, 9] },
    ] },
  ],
  meals: [
    { date: '2026-11-22', time: '08:00', name: 'a', kcal: 2000, protein: 150, carbs: 200, fat: 60 },
    { date: '2026-11-23', time: '08:00', name: 'b', kcal: 1900, protein: 130, carbs: 180, fat: 70 },
  ],
  measurements: [
    { date: '2026-10-01', weight: 84, waist: 95 },
    { date: '2026-11-16', weight: 80, waist: 90 },
    { date: '2026-11-23', weight: 79.5, waist: null },
  ],
  ...over,
});

test('hedef, ekipman ve program bağlamıyla başlar', () => {
  const text = buildClaudeSummary(input());
  expect(text).toContain('Hedefim: kas kazanmak, genel güç, yağ oranını azaltmak (rekompozisyon).');
  expect(text).toContain('Ekipman: direnç bantları (hafiften ağıra: Sarı, Kırmızı), 10 kademeli İsveç merdiveni, barfiks barı.');
  expect(text).toContain('Haftada 3 gün tüm vücut A/B programı.');
});

test('son 14 günün antrenmanlarını set set yazar; yapılmayan set – olur', () => {
  const text = buildClaudeSummary(input());
  expect(text).toContain('## Son 14 günün antrenmanları');
  expect(text).toContain('2026-11-20 (A): Barfiks – Bant destekli (Kırmızı): 6, 6, 5; Şınav – Eğimli şınav – 7. kademe: 10, –, 9');
});

test('14 günlük pencerenin dışındaki oturumları yazmaz, sınırdakini yazar', () => {
  const text = buildClaudeSummary(input());
  expect(text).not.toContain('2026-11-08');
  expect(text).toContain('2026-11-10 (A)');
});

test('hareketlerin mevcut seviyesini ve hedefini yazar', () => {
  const text = buildClaudeSummary(input());
  expect(text).toContain('## Hareketlerin şu anki seviyesi');
  expect(text).toContain('Barfiks: Bant destekli (Sarı), hedef 3 × 6 (aralık 4–8)');
  expect(text).toContain('Şınav: başlangıç seviyesi seçilmedi');
});

test('beslenme ortalamasını hedefle birlikte yazar', () => {
  const text = buildClaudeSummary(input());
  expect(text).toContain('## Beslenme (son 14 gün, kayıt girilen 2 gün ortalaması)');
  expect(text).toContain('Kalori 1950 / hedef 2200 kcal');
  expect(text).toContain('Protein 140 / hedef 160 g');
});

test('hedef girilmemişse belirtir', () => {
  const text = buildClaudeSummary(input({ settings: { ...settings, targets: null } }));
  expect(text).toContain('Kalori 1950 kcal (hedef girilmedi)');
});

test('öğün yoksa beslenme bölümünde "Kayıt yok." yazar', () => {
  const text = buildClaudeSummary(input({ meals: [] }));
  const section = text.split('## Beslenme')[1].split('##')[0];
  expect(section).toContain('Kayıt yok.');
});

test('son 4 haftanın ölçümlerini Türkçe sayı biçimiyle yazar', () => {
  const text = buildClaudeSummary(input());
  expect(text).toContain('## Kilo ve bel (son 4 hafta)');
  expect(text).toContain('2026-11-16: 80 kg, bel 90 cm');
  expect(text).toContain('2026-11-23: 79,5 kg');
  expect(text).not.toContain('2026-10-01');
});

test('hiç veri yoksa her bölümde "Kayıt yok." yazar', () => {
  const text = buildClaudeSummary(input({ sessions: [], meals: [], measurements: [] }));
  expect(text.match(/Kayıt yok\./g)).toHaveLength(3);
});

test('sabit soruyla biter', () => {
  expect(buildClaudeSummary(input()).trimEnd().split('\n').at(-1))
    .toBe('Bu verilere bakarak programımı ve beslenmemi nasıl ayarlamalıyım?');
});
