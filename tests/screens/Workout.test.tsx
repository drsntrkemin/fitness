import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Workout from '../../src/screens/Workout';
import * as repo from '../../src/data/repo';
import type { Settings, Session } from '../../src/domain/types';

const settings: Settings = {
  ...structuredClone(repo.DEFAULT_SETTINGS),
  setupDone: true,
  equipment: { bands: [{ id: 'b1', name: 'Sarı' }, { id: 'b2', name: 'Kırmızı' }], ladderRungs: 10 },
};

const active = (over: Partial<Session> = {}): Session => ({
  date: '2026-11-23', day: 'A', status: 'active',
  exercises: [
    { exerciseId: 'pullup', level: -1, levelLabel: '', targetReps: 4, sets: [null, null, null] },
    { exerciseId: 'pushup', level: 1, levelLabel: 'Eğimli şınav – 9. kademe', targetReps: 10, sets: [null, null, null] },
  ],
  ...over,
});

beforeEach(async () => {
  await repo.resetAll();
  await repo.saveSettings(settings);
  vi.restoreAllMocks();
});

test('aktif oturum varken ekran "Başla" değil oturumu açar (yarım antrenman)', async () => {
  await repo.saveSession(active());
  render(<Workout settings={settings} />);
  expect(await screen.findByRole('heading', { name: 'Antrenman A' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Başla' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Bitir' })).toBeDisabled();
});

test('oturum yokken sıradaki günü, hareket seviyelerini ve Başla düğmesini gösterir', async () => {
  await repo.putExerciseStates({ pushup: { level: 1, targetReps: 10, failStreak: 0 } });
  await repo.saveSession({ ...active(), day: 'A', status: 'done', date: '2026-11-20' });
  render(<Workout settings={settings} />);
  expect(await screen.findByText('Sıradaki: Antrenman B')).toBeInTheDocument();
  expect(screen.getByText('Eğimli şınav – 9. kademe · 3 × 10')).toBeInTheDocument();
  expect(screen.getAllByText('Seviye seçilmedi').length).toBeGreaterThan(0);
  expect(screen.getByText(/20 Kas Cum/)).toBeInTheDocument();
});

test('Başla aktif oturumu oluşturup kaydeder', async () => {
  const user = userEvent.setup();
  render(<Workout settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Başla' }));
  expect(await screen.findByRole('heading', { name: 'Antrenman A' })).toBeInTheDocument();
  expect((await repo.getActiveSession())?.day).toBe('A');
});

test('boş set kutusuna tek dokunuş hedefi yazar ve anında kaydeder', async () => {
  const user = userEvent.setup();
  await repo.saveSession(active());
  render(<Workout settings={settings} />);
  const box = await screen.findByRole('button', { name: 'Şınav set 1' });
  expect(box).toHaveTextContent('10');
  expect(box).toHaveAttribute('data-empty', 'true');
  await user.click(box);
  expect(screen.getByRole('button', { name: 'Şınav set 1' })).toHaveAttribute('data-empty', 'false');
  await vi.waitFor(async () => expect((await repo.getActiveSession())?.exercises[1].sets).toEqual([10, null, null]));
  expect(screen.getByRole('button', { name: 'Bitir' })).toBeEnabled();
});

test('dolu set kutusu +/− ile düzeltilir ve temizlenebilir', async () => {
  const user = userEvent.setup();
  await repo.saveSession(active());
  render(<Workout settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Şınav set 1' }));
  await user.click(screen.getByRole('button', { name: 'Şınav set 1' }));
  await user.click(screen.getByRole('button', { name: 'Bir azalt' }));
  await user.click(screen.getByRole('button', { name: 'Bir azalt' }));
  await user.click(screen.getByRole('button', { name: 'Tamam' }));
  expect(screen.getByRole('button', { name: 'Şınav set 1' })).toHaveTextContent('8');
  await vi.waitFor(async () => expect((await repo.getActiveSession())?.exercises[1].sets[0]).toBe(8));
  await user.click(screen.getByRole('button', { name: 'Şınav set 1' }));
  await user.click(screen.getByRole('button', { name: 'Temizle' }));
  await vi.waitFor(async () => expect((await repo.getActiveSession())?.exercises[1].sets[0]).toBeNull());
});

test('seviyesi seçilmemiş harekette başlangıç seviyesi seçilir', async () => {
  const user = userEvent.setup();
  await repo.saveSession(active());
  render(<Workout settings={settings} />);
  const card = (await screen.findByRole('heading', { name: 'Barfiks' })).closest('section')!;
  expect(within(card).getByText('Başlangıç seviyeni seç')).toBeInTheDocument();
  await user.click(within(card).getByRole('button', { name: 'Bant destekli (Sarı)' }));
  expect(within(card).getByText('Bant destekli (Sarı)')).toBeInTheDocument();
  expect(within(card).getByText(/Hedef: 3 × 4/)).toBeInTheDocument();
  await vi.waitFor(async () => expect((await repo.getActiveSession())?.exercises[0]).toMatchObject({ level: 2, targetReps: 4 }));
});

test('Bitir ilerlemeyi uygular, oturumu kapatır ve özeti gösterir', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  await repo.putExerciseStates({ pushup: { level: 1, targetReps: 10, failStreak: 0 } });
  await repo.saveSession(active({ exercises: [
    { exerciseId: 'pushup', level: 1, levelLabel: 'Eğimli şınav – 9. kademe', targetReps: 10, sets: [10, 10, 10] },
  ] }));
  render(<Workout settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Bitir' }));
  expect(await screen.findByText('Sonraki sefer: 3×11')).toBeInTheDocument();
  expect(await repo.getActiveSession()).toBeUndefined();
  expect(await repo.lastFinishedDay()).toBe('A');
  expect((await repo.getExerciseStates()).pushup).toEqual({ level: 1, targetReps: 11, failStreak: 0 });
  await user.click(screen.getByRole('button', { name: 'Tamam' }));
  expect(await screen.findByText('Sıradaki: Antrenman B')).toBeInTheDocument();
});

test('boş set varken Bitir onay ister; vazgeçilirse oturum açık kalır', async () => {
  const user = userEvent.setup();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await repo.saveSession(active({ exercises: [
    { exerciseId: 'pushup', level: 1, levelLabel: 'Eğimli şınav – 9. kademe', targetReps: 10, sets: [10, null, null] },
  ] }));
  render(<Workout settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Bitir' }));
  expect(confirm).toHaveBeenCalled();
  expect(await repo.getActiveSession()).toBeDefined();
});

test('Vazgeç onaylanınca oturum silinir ve sıra değişmez', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  await repo.saveSession(active());
  render(<Workout settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Vazgeç' }));
  expect(await screen.findByText('Sıradaki: Antrenman A')).toBeInTheDocument();
  expect(await repo.getActiveSession()).toBeUndefined();
  expect(await repo.lastFinishedDay()).toBeNull();
});

test('uzun merdivenli harekette başlangıç seviyesi açılır listeden seçilir', async () => {
  const user = userEvent.setup();
  await repo.saveSession(active({ exercises: [
    { exerciseId: 'pushup', level: -1, levelLabel: '', targetReps: 8, sets: [null, null, null] },
  ] }));
  render(<Workout settings={settings} />);
  const select = await screen.findByRole('combobox', { name: 'Başlangıç seviyeni seç' });
  await user.selectOptions(select, 'Yer şınavı');
  expect(screen.getByText('Yer şınavı')).toBeInTheDocument();
  await vi.waitFor(async () => expect((await repo.getActiveSession())?.exercises[0]).toMatchObject({ level: 10, levelLabel: 'Yer şınavı' }));
});
