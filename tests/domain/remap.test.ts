import { EXERCISES } from '../../src/domain/catalog';
import { buildLadder } from '../../src/domain/program';
import { remapLevel, remapStates, remapSession } from '../../src/domain/remap';
import type { Equipment, Session } from '../../src/domain/types';

const ex = (id: string) => EXERCISES.find((e) => e.id === id)!;
const SARI = { id: 'b1', name: 'Sarı' };
const KIRMIZI = { id: 'b2', name: 'Kırmızı' };
const SIYAH = { id: 'b3', name: 'Siyah' };
const base: Equipment = { bands: [SARI, KIRMIZI, SIYAH], ladderRungs: 10 };
const label = (id: string, eq: Equipment, level: number) => buildLadder(ex(id), eq)[level];

test('daha ağır bant eklenince barfiks "Tam barfiks"te kalır', () => {
  const next: Equipment = { ...base, bands: [...base.bands, { id: 'b4', name: 'Mor' }] };
  expect(label('pullup', base, 4)).toBe('Tam barfiks');
  expect(label('pullup', next, remapLevel(ex('pullup'), base, next, 4))).toBe('Tam barfiks');
});

test('en başa daha hafif bant eklenince squat aynı bantta kalır', () => {
  const next: Equipment = { ...base, bands: [{ id: 'b0', name: 'Yeşil' }, ...base.bands] };
  expect(label('band-squat', next, remapLevel(ex('band-squat'), base, next, 1))).toBe('Bantlı squat (Kırmızı)');
});

test('bant adı değişince seviye aynı bantta kalır', () => {
  const next: Equipment = { ...base, bands: [SARI, { id: 'b2', name: 'Kırmızı-2' }, SIYAH] };
  expect(remapLevel(ex('band-squat'), base, next, 1)).toBe(1);
});

test('kademe sayısı değişince yer şınavı yer şınavı olarak kalır', () => {
  for (const rungs of [8, 12]) {
    const next = { ...base, ladderRungs: rungs };
    expect(label('pushup', next, remapLevel(ex('pushup'), base, next, 10))).toBe('Yer şınavı');
  }
});

test('kullanılan bant silinirse bir kolay seviyeye iner', () => {
  const next: Equipment = { ...base, bands: [SARI, SIYAH] };
  expect(label('band-squat', next, remapLevel(ex('band-squat'), base, next, 1))).toBe('Bantlı squat (Sarı)');
});

test('remapStates hedefi korur; seviye değiştiyse başarısızlık sayacını sıfırlar', () => {
  const next: Equipment = { ...base, bands: [SARI, SIYAH] };
  const out = remapStates({
    'band-squat': { level: 1, targetReps: 10, failStreak: 1 },
    'band-press': { level: 0, targetReps: 9, failStreak: 1 },
  }, base, next);
  expect(out['band-squat']).toEqual({ level: 0, targetReps: 10, failStreak: 0 });
  expect(out['band-press']).toEqual({ level: 0, targetReps: 9, failStreak: 1 });
});

test('remapSession aktif oturumdaki seviye ve etiketleri yeni merdivene taşır, seçilmemişlere dokunmaz', () => {
  const next: Equipment = { ...base, bands: [{ id: 'b0', name: 'Yeşil' }, ...base.bands] };
  const s: Session = { date: '2026-11-23', day: 'A', status: 'active', exercises: [
    { exerciseId: 'band-squat', level: 1, levelLabel: 'Bantlı squat (Kırmızı)', targetReps: 9, sets: [9, null, null] },
    { exerciseId: 'pullup', level: -1, levelLabel: '', targetReps: 4, sets: [null, null, null] },
  ] };
  const out = remapSession(s, base, next);
  expect(out.exercises[0]).toEqual({ ...s.exercises[0], level: 2, levelLabel: 'Bantlı squat (Kırmızı)' });
  expect(out.exercises[1]).toEqual(s.exercises[1]);
});
