import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Workout from '../../src/screens/Workout';
import * as repo from '../../src/data/repo';
import type { Settings, Session } from '../../src/domain/types';

const settings: Settings = {
  ...structuredClone(repo.DEFAULT_SETTINGS),
  setupDone: true,
  hasPullupBar: true,
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
  const row = screen.getByText('Şınav').closest('li')!;
  expect(within(row).getByText('Eğimli şınav – 9. kademe')).toBeInTheDocument();
  expect(within(row).getByText('3 × 10')).toBeInTheDocument();
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

test('Başla\'ya art arda iki dokunuş tek oturum açar', async () => {
  const { fireEvent } = await import('@testing-library/react');
  const { db } = await import('../../src/data/db');
  render(<Workout settings={settings} />);
  const start = await screen.findByRole('button', { name: 'Başla' });
  fireEvent.click(start);
  fireEvent.click(start);
  await screen.findByRole('heading', { name: 'Antrenman A' });
  await new Promise((r) => setTimeout(r, 50));
  expect(await db.sessions.where('status').equals('active').count()).toBe(1);
});

test('Bitir\'e art arda iki dokunuş ilerlemeyi bir kez uygular', async () => {
  const { fireEvent } = await import('@testing-library/react');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const st = { 'band-squat': { level: 1, targetReps: 8, failStreak: 0 } };
  await repo.putExerciseStates(st);
  await repo.saveSession(active({ exercises: [
    { exerciseId: 'band-squat', level: 1, levelLabel: 'Bantlı squat (Kırmızı)', targetReps: 8, sets: [5, 5, 5] },
  ] }));
  render(<Workout settings={settings} />);
  const finish = await screen.findByRole('button', { name: 'Bitir' });
  fireEvent.click(finish);
  fireEvent.click(finish);
  await screen.findByRole('heading', { name: /Antrenman bitti/ });
  await new Promise((r) => setTimeout(r, 50));
  expect((await repo.getExerciseStates())['band-squat']).toEqual({ level: 1, targetReps: 8, failStreak: 1 });
});

describe('kas haritası', () => {
  test('antrenman başında gün haritası yok; her hareketin kendi küçük kas figürü var', async () => {
    await repo.saveSession(active());
    render(<Workout settings={settings} />);
    const card = (await screen.findByRole('heading', { name: 'Barfiks' })).closest('section')!;
    expect(screen.queryByRole('heading', { name: /Bugün çalışacak kasların/ })).not.toBeInTheDocument();
    expect(within(card).getByRole('img', { name: 'Arka: Kanat, Üst sırt, Arka omuz, Ön kol' })).toBeInTheDocument();
    expect(within(card).getByRole('img', { name: 'Ön: Biceps, Ön kol' })).toBeInTheDocument();
    const pushup = screen.getByRole('heading', { name: 'Şınav' }).closest('section')!;
    expect(within(pushup).getByRole('img', { name: 'Ön: Göğüs, Omuz, Karın' })).toBeInTheDocument();
  });

  test('her hareket kartında çalışan kas etiketleri var', async () => {
    await repo.saveSession(active());
    render(<Workout settings={settings} />);
    const card = (await screen.findByRole('heading', { name: 'Barfiks' })).closest('section')!;
    const chips = within(card).getByRole('list', { name: 'Çalışan kaslar' });
    expect(within(chips).getByText('Kanat')).toHaveClass('chip-p');
    expect(within(chips).getByText('Ön kol')).toHaveClass('chip-s');
  });

  test('bitirince çalıştırılan kaslar ve set/ilerleme özeti gösterilir', async () => {
    const user = userEvent.setup();
    await repo.putExerciseStates({ pushup: { level: 1, targetReps: 10, failStreak: 0 } });
    await repo.saveSession(active({ exercises: [
      { exerciseId: 'pullup', level: 1, levelLabel: 'Bant destekli (Siyah)', targetReps: 4, sets: [null, null, null] },
      { exerciseId: 'pushup', level: 1, levelLabel: 'Eğimli şınav – 9. kademe', targetReps: 10, sets: [10, 10, 10] },
    ] }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Workout settings={settings} />);
    await user.click(await screen.findByRole('button', { name: 'Bitir' }));
    const hero = (await screen.findByRole('heading', { name: 'Bugün çalıştırdığın kaslar' })).closest('section')!;
    expect(within(hero).getByText('3 set · 1 hareket ilerledi')).toBeInTheDocument();
    // Yalnız set girilen şınavın kasları: göğüs var, kanat (barfiks) yok.
    expect(within(hero).getByRole('img', { name: /^Ön: Göğüs/ })).toBeInTheDocument();
    expect(within(hero).getByRole('img', { name: /^Arka: Triceps$/ })).toBeInTheDocument();
  });

  test('ilerleme yoksa "Aynı hedeflerle devam" yazar', async () => {
    const user = userEvent.setup();
    await repo.saveSession(active({ exercises: [
      { exerciseId: 'band-squat', level: 1, levelLabel: 'Bantlı squat (Kırmızı)', targetReps: 10, sets: [9, 9, 9] },
    ] }));
    render(<Workout settings={settings} />);
    await user.click(await screen.findByRole('button', { name: 'Bitir' }));
    expect(await screen.findByText('3 set · Aynı hedeflerle devam')).toBeInTheDocument();
  });

  test('bekleme ekranındaki "Sıradaki" kartında kaslı dost ve seviyesi var', async () => {
    for (let i = 0; i < 4; i++) await repo.saveSession({ ...active(), date: `2026-11-1${i}`, status: 'done' });
    render(<Workout settings={settings} />);
    // Son biten A olduğu için sıradaki B.
    const card = (await screen.findByText('Sıradaki: Antrenman B')).closest('section')!;
    expect(within(card).getByRole('img', { name: 'Kaslı dostun, seviye 2, tombul' })).toBeInTheDocument();
    expect(within(card).getByText('4 antrenman tamamladın 💪')).toBeInTheDocument();
    expect(within(card).getByText('Sonraki seviyeye 2 antrenman')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Başla' })).toBeInTheDocument();
  });
});

test('seviye geri düşülen bitişte "Aynı hedeflerle devam" yazmaz', async () => {
  const user = userEvent.setup();
  await repo.putExerciseStates({ 'band-squat': { level: 1, targetReps: 8, failStreak: 1 } });
  await repo.saveSession(active({ exercises: [
    { exerciseId: 'band-squat', level: 1, levelLabel: 'Bantlı squat (Kırmızı)', targetReps: 8, sets: [5, 5, 5] },
  ] }));
  render(<Workout settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Bitir' }));
  expect(await screen.findByText(/^Bir seviye geri/)).toBeInTheDocument();
  const hero = screen.getByRole('heading', { name: 'Bugün çalıştırdığın kaslar' }).closest('section')!;
  expect(within(hero).getByText('3 set')).toBeInTheDocument();
  expect(screen.queryByText(/Aynı hedeflerle devam/)).not.toBeInTheDocument();
});

describe('seyahat modu ve barsız program', () => {
  test('Seyahatte başla, yedek hareketlerle seyahat oturumu açar', async () => {
    const user = userEvent.setup();
    render(<Workout settings={settings} />);
    await user.click(await screen.findByRole('button', { name: 'Seyahatte başla' }));
    expect(await screen.findByRole('heading', { name: 'Antrenman A · Seyahat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bantlı eğilerek row' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yerde bacak kaldırma' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Barfiks' })).not.toBeInTheDocument();
    expect((await repo.getActiveSession())?.mode).toBe('travel');
  });

  test('bar yokken evde de barfiks yerine bantlı eğilerek row gelir', async () => {
    const user = userEvent.setup();
    const noBar = { ...settings, hasPullupBar: false };
    render(<Workout settings={noBar} />);
    const aDay = (await screen.findByText('A günü')).closest('section')!;
    expect(within(aDay).getByText('Bantlı eğilerek row')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Başla' }));
    expect(await screen.findByRole('heading', { name: 'Antrenman A' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bantlı eğilerek row' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Şınav' })).toBeInTheDocument();
  });

  test('autoStart="travel" seyahat oturumunu doğrudan başlatır', async () => {
    render(<Workout settings={settings} autoStart="travel" />);
    expect(await screen.findByRole('heading', { name: 'Antrenman A · Seyahat' })).toBeInTheDocument();
  });

  test('seyahat hareketinin kartında kendi kas figürü var', async () => {
    const user = userEvent.setup();
    render(<Workout settings={settings} />);
    await user.click(await screen.findByRole('button', { name: 'Seyahatte başla' }));
    const card = (await screen.findByRole('heading', { name: 'Bantlı eğilerek row' })).closest('section')!;
    expect(within(card).getByRole('img', { name: /^Arka: Kanat, Üst sırt/ })).toBeInTheDocument();
  });
});
