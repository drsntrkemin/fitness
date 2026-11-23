import { createSession, finishSession, chooseLevel, setRep, hasAnySet } from '../../src/domain/session';
import { DEFAULT_SETTINGS } from '../../src/data/repo';
import type { Settings, Session } from '../../src/domain/types';

const settings: Settings = {
  ...structuredClone(DEFAULT_SETTINGS),
  setupDone: true,
  equipment: { bands: [{ id: 'b1', name: 'Sarı' }, { id: 'b2', name: 'Kırmızı' }], ladderRungs: 10 },
};
const ex = (s: Session, id: string) => s.exercises.find((e) => e.exerciseId === id)!;

describe('createSession', () => {
  test('günün hareketlerini durumlarındaki seviye ve hedefle, boş setlerle oluşturur', () => {
    const s = createSession('A', '2026-11-23', settings, { pushup: { level: 1, targetReps: 10, failStreak: 0 } });
    expect(s).toMatchObject({ date: '2026-11-23', day: 'A', status: 'active' });
    expect(s.exercises.map((e) => e.exerciseId)).toEqual(['pullup', 'pushup', 'band-squat', 'band-rdl', 'hanging-raise']);
    expect(ex(s, 'pushup')).toEqual({ exerciseId: 'pushup', level: 1, levelLabel: 'Eğimli şınav – 9. kademe', targetReps: 10, sets: [null, null, null] });
  });

  test('durumu olmayan hareket "seviye seçilmedi" (-1) olarak gelir', () => {
    const s = createSession('A', '2026-11-23', settings, {});
    expect(ex(s, 'pullup')).toMatchObject({ level: -1, levelLabel: '' });
  });

  test('bant silinip merdiven kısaldıysa seviye merdivene sığdırılır', () => {
    const s = createSession('A', '2026-11-23', settings, { 'band-squat': { level: 5, targetReps: 9, failStreak: 0 } });
    expect(ex(s, 'band-squat')).toMatchObject({ level: 1, levelLabel: 'Bantlı squat (Kırmızı)', targetReps: 9 });
  });

  test('haftada 2 günde ana hareketler 4, karın 3 set', () => {
    const s = createSession('A', '2026-11-23', { ...settings, daysPerWeek: 2 }, {});
    expect(ex(s, 'band-squat').sets).toHaveLength(4);
    expect(ex(s, 'hanging-raise').sets).toHaveLength(3);
  });
});

describe('chooseLevel ve setRep', () => {
  test('seviye seçimi etiketi günceller ve hedefi alt sınıra çeker', () => {
    const s = chooseLevel(createSession('A', '2026-11-23', settings, {}), 'pullup', 2, settings);
    expect(ex(s, 'pullup')).toMatchObject({ level: 2, levelLabel: 'Bant destekli (Sarı)', targetReps: 4 });
  });

  test('setRep yalnızca ilgili seti değiştirir, orijinali bozmaz', () => {
    const before = createSession('A', '2026-11-23', settings, {});
    const after = setRep(before, 'pushup', 1, 9);
    expect(ex(after, 'pushup').sets).toEqual([null, 9, null]);
    expect(ex(before, 'pushup').sets).toEqual([null, null, null]);
  });

  test('hasAnySet en az bir set girilmiş mi söyler', () => {
    const s = createSession('A', '2026-11-23', settings, {});
    expect(hasAnySet(s)).toBe(false);
    expect(hasAnySet(setRep(s, 'pushup', 0, 8))).toBe(true);
  });
});

describe('finishSession', () => {
  test('tüm setlerde hedef yapılınca hedef artar ve mesaj verilir', () => {
    let s = createSession('A', '2026-11-23', settings, { pushup: { level: 1, targetReps: 10, failStreak: 0 } });
    for (const i of [0, 1, 2]) s = setRep(s, 'pushup', i, 10);
    const r = finishSession(s, settings, { pushup: { level: 1, targetReps: 10, failStreak: 0 } });
    expect(r.states.pushup).toEqual({ level: 1, targetReps: 11, failStreak: 0 });
    expect(r.results.find((x) => x.exerciseId === 'pushup')).toEqual({ exerciseId: 'pushup', event: 'reps-up', message: 'Sonraki sefer: 3×11' });
  });

  test('seviye atlayınca yeni seviyenin adı mesajda yer alır', () => {
    const st = { 'band-squat': { level: 0, targetReps: 12, failStreak: 0 } };
    let s = createSession('A', '2026-11-23', settings, st);
    for (const i of [0, 1, 2]) s = setRep(s, 'band-squat', i, 12);
    const r = finishSession(s, settings, st);
    expect(r.states['band-squat']).toEqual({ level: 1, targetReps: 8, failStreak: 0 });
    expect(r.results.find((x) => x.exerciseId === 'band-squat')?.message).toBe('Yeni seviye: Bantlı squat (Kırmızı) 🎉');
  });

  test('seviyesi seçilmemiş hareket "Yapılmadı" olur ve durum yazılmaz', () => {
    const r = finishSession(createSession('A', '2026-11-23', settings, {}), settings, {});
    expect(r.results.find((x) => x.exerciseId === 'pullup')).toEqual({ exerciseId: 'pullup', event: 'skipped', message: 'Yapılmadı' });
    expect(r.states.pullup).toBeUndefined();
  });

  test('seviye seçilip hiç set yapılmadıysa seçilen seviye yine de kaydedilir', () => {
    const s = chooseLevel(createSession('A', '2026-11-23', settings, {}), 'pullup', 2, settings);
    const r = finishSession(s, settings, {});
    expect(r.states.pullup).toEqual({ level: 2, targetReps: 4, failStreak: 0 });
    expect(r.results.find((x) => x.exerciseId === 'pullup')?.event).toBe('skipped');
  });

  test('elle seviye değiştirildiyse eski başarısızlık sayacı taşınmaz', () => {
    const st = { 'band-squat': { level: 1, targetReps: 8, failStreak: 1 } };
    let s = chooseLevel(createSession('A', '2026-11-23', settings, st), 'band-squat', 0, settings);
    for (const i of [0, 1, 2]) s = setRep(s, 'band-squat', i, 5);
    const r = finishSession(s, settings, st);
    expect(r.states['band-squat']).toEqual({ level: 0, targetReps: 8, failStreak: 1 });
    expect(r.results.find((x) => x.exerciseId === 'band-squat')?.event).toBe('none');
  });

  test('aynı seviyede ikinci başarısızlıkta geri düşer', () => {
    const st = { 'band-squat': { level: 1, targetReps: 8, failStreak: 1 } };
    let s = createSession('A', '2026-11-23', settings, st);
    for (const i of [0, 1, 2]) s = setRep(s, 'band-squat', i, 5);
    const r = finishSession(s, settings, st);
    expect(r.states['band-squat']).toEqual({ level: 0, targetReps: 10, failStreak: 0 });
    expect(r.results.find((x) => x.exerciseId === 'band-squat')?.message).toBe('Bir seviye geri: Bantlı squat (Sarı)');
  });

  test('dokunulmayan hareketlerin mevcut durumları korunur', () => {
    const st = { 'inverted-row': { level: 3, targetReps: 9, failStreak: 0 } };
    const r = finishSession(createSession('A', '2026-11-23', settings, {}), settings, st);
    expect(r.states['inverted-row']).toEqual(st['inverted-row']);
  });
});
