import * as repo from '../../src/data/repo';
import type { Session } from '../../src/domain/types';

beforeEach(async () => { await repo.resetAll(); });

const session = (over: Partial<Session> = {}): Session => ({
  date: '2026-11-23', day: 'A', status: 'active',
  exercises: [{ exerciseId: 'pullup', level: 1, levelLabel: 'Bant destekli (Kırmızı)', targetReps: 6, sets: [6, null, null] }],
  ...over,
});

describe('ayarlar', () => {
  test('boş veritabanında varsayılan ayarlar döner', async () => {
    expect(await repo.getSettings()).toEqual(repo.DEFAULT_SETTINGS);
    expect(repo.DEFAULT_SETTINGS).toEqual({
      targets: null, daysPerWeek: 3, equipment: { bands: [], ladderRungs: 10 },
      overrides: {}, lastBackup: null, setupDone: false,
    });
  });

  test('kaydedilen ayarlar geri okunur', async () => {
    const s = { ...repo.DEFAULT_SETTINGS, daysPerWeek: 2 as const, setupDone: true,
      targets: { kcal: 2200, protein: 160, carbs: 220, fat: 70 } };
    await repo.saveSettings(s);
    expect(await repo.getSettings()).toEqual(s);
  });

  test('döndürülen varsayılan nesnesini değiştirmek varsayılanları bozmaz', async () => {
    const s = await repo.getSettings();
    s.equipment.bands.push({ id: 'x', name: 'X' });
    expect(repo.DEFAULT_SETTINGS.equipment.bands).toEqual([]);
  });
});

describe('hareket durumları', () => {
  test('yazılan durumlar kayıt olarak okunur ve birleştirilir', async () => {
    await repo.putExerciseStates({ pullup: { level: 1, targetReps: 6, failStreak: 0 } });
    await repo.putExerciseStates({ pushup: { level: 3, targetReps: 9, failStreak: 1 } });
    expect(await repo.getExerciseStates()).toEqual({
      pullup: { level: 1, targetReps: 6, failStreak: 0 },
      pushup: { level: 3, targetReps: 9, failStreak: 1 },
    });
  });
});

describe('oturumlar', () => {
  test('yarım kalan (aktif) oturum geri okunur', async () => {
    const id = await repo.saveSession(session());
    expect(await repo.getActiveSession()).toEqual({ ...session(), id });
  });

  test('id alanı açıkça undefined olan yeni oturum da kaydedilir', async () => {
    const id = await repo.saveSession({ ...session(), id: undefined });
    expect(typeof id).toBe('number');
    expect((await repo.getActiveSession())?.id).toBe(id);
  });

  test('bitirilen oturum aktif değildir ve son günü belirler', async () => {
    expect(await repo.lastFinishedDay()).toBeNull();
    const id = await repo.saveSession(session());
    await repo.saveSession({ ...session(), id, status: 'done' });
    expect(await repo.getActiveSession()).toBeUndefined();
    expect(await repo.lastFinishedDay()).toBe('A');
  });

  test('bitmiş oturumlar tarih azalan listelenir; fromDate ile süzülür', async () => {
    await repo.saveSession(session({ date: '2026-11-18', day: 'A', status: 'done' }));
    await repo.saveSession(session({ date: '2026-11-20', day: 'B', status: 'done' }));
    await repo.saveSession(session({ date: '2026-11-23', day: 'A', status: 'active' }));
    expect((await repo.listSessions()).map((s) => s.date)).toEqual(['2026-11-20', '2026-11-18']);
    expect((await repo.listSessions('2026-11-19')).map((s) => s.date)).toEqual(['2026-11-20']);
    expect(await repo.lastFinishedDay()).toBe('B');
  });

  test('aynı gün iki oturumda son biten belirleyicidir', async () => {
    await repo.saveSession(session({ day: 'A', status: 'done' }));
    await repo.saveSession(session({ day: 'B', status: 'done' }));
    expect(await repo.lastFinishedDay()).toBe('B');
  });
});

describe('öğünler', () => {
  const m = (date: string, kcal: number) => ({ date, time: '12:00', name: 'x', kcal, protein: 0, carbs: 0, fat: 0 });

  test('listMeals sadece istenen aralığı döner', async () => {
    await repo.addMeal(m('2026-11-22', 100));
    await repo.addMeal(m('2026-11-23', 200));
    await repo.addMeal(m('2026-11-24', 300));
    expect((await repo.listMeals('2026-11-23', '2026-11-23')).map((x) => x.kcal)).toEqual([200]);
    expect(await repo.allMeals()).toHaveLength(3);
  });

  test('öğün güncellenir ve silinir', async () => {
    const id = await repo.addMeal(m('2026-11-23', 200));
    await repo.updateMeal({ ...m('2026-11-23', 250), id });
    expect((await repo.allMeals())[0].kcal).toBe(250);
    await repo.deleteMeal(id);
    expect(await repo.allMeals()).toEqual([]);
  });
});

describe('ölçümler', () => {
  test('aynı tarihe ikinci ölçüm öncekinin üzerine yazılır; tarih artan sıralanır', async () => {
    await repo.putMeasurement({ date: '2026-11-23', weight: 80, waist: null });
    await repo.putMeasurement({ date: '2026-11-16', weight: 81, waist: 90 });
    await repo.putMeasurement({ date: '2026-11-23', weight: 79.5, waist: 88 });
    expect(await repo.listMeasurements()).toEqual([
      { date: '2026-11-16', weight: 81, waist: 90 },
      { date: '2026-11-23', weight: 79.5, waist: 88 },
    ]);
  });
});
