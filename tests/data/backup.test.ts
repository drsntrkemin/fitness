import * as repo from '../../src/data/repo';
import { exportAll, importAll, BackupError } from '../../src/data/backup';

beforeEach(async () => { await repo.resetAll(); });

async function seed() {
  await repo.saveSettings({ ...repo.DEFAULT_SETTINGS, setupDone: true,
    equipment: { bands: [{ id: 'b1', name: 'Kırmızı' }], ladderRungs: 8 } });
  await repo.putExerciseStates({ pullup: { level: 1, targetReps: 6, failStreak: 0 } });
  await repo.saveSession({ date: '2026-11-20', day: 'A', status: 'done',
    exercises: [{ exerciseId: 'pullup', level: 1, levelLabel: 'Bant destekli (Kırmızı)', targetReps: 6, sets: [6, 6, 5] }] });
  await repo.addMeal({ date: '2026-11-23', time: '08:00', name: 'Yulaf', kcal: 300, protein: 10, carbs: 50, fat: 6 });
  await repo.putMeasurement({ date: '2026-11-23', weight: 80, waist: 90 });
}

const withoutStamp = ({ exportedAt: _ignored, ...rest }: Awaited<ReturnType<typeof exportAll>>) => rest;

test('dışa aktar → sıfırla → geri yükle tüm verileri aynen geri getirir', async () => {
  await seed();
  const backup = await exportAll();
  expect(backup.app).toBe('ev-fitness');
  expect(backup.version).toBe(1);
  await repo.resetAll();
  expect(await repo.allMeals()).toEqual([]);
  await importAll(JSON.parse(JSON.stringify(backup)));
  expect(withoutStamp(await exportAll())).toEqual(withoutStamp(backup));
});

test('JSON metni olarak verilen yedek de yüklenir', async () => {
  await seed();
  const text = JSON.stringify(await exportAll());
  await repo.resetAll();
  await importAll(text);
  expect(await repo.allMeals()).toHaveLength(1);
});

test('alakasız dosya reddedilir ve mevcut verilere dokunulmaz', async () => {
  await seed();
  await expect(importAll({ foo: 1 })).rejects.toBeInstanceOf(BackupError);
  expect(await repo.allMeals()).toHaveLength(1);
  expect((await repo.getSettings()).setupDone).toBe(true);
});

test('yarım (bozuk) JSON metni reddedilir', async () => {
  await seed();
  await expect(importAll('{"app":"ev-fit')).rejects.toThrow('Geçersiz yedek dosyası');
  expect(await repo.allMeals()).toHaveLength(1);
});

test('bilinmeyen sürüm reddedilir', async () => {
  await seed();
  const backup = { ...(await exportAll()), version: 2 };
  await expect(importAll(backup)).rejects.toBeInstanceOf(BackupError);
});

test('eksik tablo içeren yedek reddedilir', async () => {
  await seed();
  const { meals: _m, ...partial } = await exportAll();
  await expect(importAll(partial)).rejects.toBeInstanceOf(BackupError);
  expect(await repo.allMeals()).toHaveLength(1);
});

test('öğünlerinde bozuk kayıt olan yedek reddedilir', async () => {
  await seed();
  const backup = await exportAll();
  const broken = { ...backup, meals: [{ date: 5, kcal: 'çok' }] };
  await expect(importAll(broken)).rejects.toBeInstanceOf(BackupError);
  expect(await repo.allMeals()).toHaveLength(1);
});
