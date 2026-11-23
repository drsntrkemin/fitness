import { progress, initialState } from '../../src/domain/progression';
import type { ExerciseState } from '../../src/domain/types';

const range = { repMin: 8, repMax: 12 };
const L = 4;
const st = (level: number, targetReps: number, failStreak = 0): ExerciseState => ({ level, targetReps, failStreak });

test('tüm setlerde hedef yapılırsa hedef bir artar', () => {
  expect(progress(st(1, 10), [10, 10, 11], range, L)).toEqual({ state: st(1, 11), event: 'reps-up' });
});

test('üst sınır aşılınca bir sonraki seviyeye geçer ve tekrar alt sınıra döner', () => {
  expect(progress(st(1, 12), [12, 12, 12], range, L)).toEqual({ state: st(2, 8), event: 'level-up' });
});

test('merdivenin tepesinde seviye ve hedef sabit kalır', () => {
  expect(progress(st(3, 12), [12, 12, 12], range, L)).toEqual({ state: st(3, 12), event: 'max-level' });
});

test('bir set hedefin altında kalırsa hedef aynı kalır', () => {
  expect(progress(st(1, 10), [10, 9, 10], range, L)).toEqual({ state: st(1, 10), event: 'none' });
});

test('yapılmamış (boş) set hedefi tutturmamış sayılır', () => {
  expect(progress(st(1, 10), [10, null, 10], range, L)).toEqual({ state: st(1, 10), event: 'none' });
});

test('hiç set yapılmadıysa durum birebir aynı kalır', () => {
  const before = st(1, 10, 1);
  expect(progress(before, [null, null, null], range, L)).toEqual({ state: before, event: 'skipped' });
});

test('üst üste iki oturum alt sınırın altında kalınca bir seviye geri düşer', () => {
  const first = progress(st(2, 8), [7, 6, 6], range, L);
  expect(first).toEqual({ state: st(2, 8, 1), event: 'none' });
  expect(progress(first.state, [7, 7, 6], range, L)).toEqual({ state: st(1, 10), event: 'level-down' });
});

test('aradaki başarılı oturum başarısızlık sayacını sıfırlar', () => {
  const ok = progress(st(2, 8, 1), [8, 8, 8], range, L);
  expect(ok.state.failStreak).toBe(0);
});

test('en alt seviyede geri düşülemez; sayaç sıfırlanır', () => {
  expect(progress(st(0, 8, 1), [5, 5, 5], range, L)).toEqual({ state: st(0, 8), event: 'none' });
});

test('geri düşmede hedef alt sınırın altına inmez (dar aralık)', () => {
  const narrow = { repMin: 8, repMax: 9 };
  expect(progress(st(2, 8, 1), [6, 6, 6], narrow, L)).toEqual({ state: st(1, 8), event: 'level-down' });
});

test('ayarlardan aralık değiştiyse hedef önce yeni aralığa çekilir', () => {
  expect(progress(st(1, 8), [10, 10, 10], { repMin: 10, repMax: 15 }, L))
    .toEqual({ state: st(1, 11), event: 'reps-up' });
});

test('merdiven kısaldıysa seviye önce merdivene sığdırılır', () => {
  expect(progress(st(6, 12), [12, 12, 12], range, L)).toEqual({ state: st(3, 12), event: 'max-level' });
});

test('initialState seçilen seviyede alt sınırdan başlar', () => {
  expect(initialState(2, 8)).toEqual(st(2, 8));
});
