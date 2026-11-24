import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Today from '../../src/screens/Today';
import * as repo from '../../src/data/repo';
import { addDays, localDateKey, weekStart } from '../../src/domain/dates';
import type { Session, Settings } from '../../src/domain/types';

const today = localDateKey(new Date());
const settings: Settings = {
  ...structuredClone(repo.DEFAULT_SETTINGS),
  setupDone: true,
  lastBackup: today,
  targets: { kcal: 2200, protein: 160, carbs: 220, fat: 70 },
};
const done = (date: string, day: 'A' | 'B' = 'A'): Session => ({ date, day, status: 'done', exercises: [] });

function renderToday(s: Settings = settings) {
  const props = { onOpenSettings: vi.fn(), onStartWorkout: vi.fn(), onStartTravelWorkout: vi.fn(), onContinueWorkout: vi.fn() };
  render(<Today settings={s} {...props} />);
  return props;
}

beforeEach(async () => {
  await repo.resetAll();
  vi.restoreAllMocks();
});

describe('haftalık ölçüm kartı', () => {
  test('son ölçüm 8 gün önceyse görünür', async () => {
    await repo.putMeasurement({ date: addDays(today, -8), weight: 80, waist: 90 });
    renderToday();
    expect(await screen.findByRole('heading', { name: 'Haftalık ölçüm' })).toBeInTheDocument();
  });

  test('son ölçüm 2 gün önceyse görünmez', async () => {
    await repo.putMeasurement({ date: addDays(today, -2), weight: 80, waist: 90 });
    renderToday();
    await screen.findByText(/Sıradaki/);
    expect(screen.queryByRole('heading', { name: 'Haftalık ölçüm' })).not.toBeInTheDocument();
  });

  test('virgüllü kilo girilip kaydedilir, bel boş kalabilir; kart kapanır', async () => {
    const user = userEvent.setup();
    renderToday();
    await screen.findByRole('heading', { name: 'Haftalık ölçüm' });
    expect(screen.getByRole('button', { name: 'Ölçümü kaydet' })).toBeDisabled();
    await user.type(screen.getByLabelText('Kilo (kg)'), '78,4');
    await user.click(screen.getByRole('button', { name: 'Ölçümü kaydet' }));
    await vi.waitFor(async () => expect((await repo.listMeasurements()).at(-1)).toEqual({ date: today, weight: 78.4, waist: null }));
    await vi.waitFor(() => expect(screen.queryByRole('heading', { name: 'Haftalık ölçüm' })).not.toBeInTheDocument());
  });
});

test('akla yatkın olmayan kilo kaydedilemez ve uyarı gösterilir', async () => {
  const user = userEvent.setup();
  renderToday();
  await screen.findByRole('heading', { name: 'Haftalık ölçüm' });
  await user.type(screen.getByLabelText('Kilo (kg)'), '785');
  expect(screen.getByText('Kilo 25–300 kg arasında olmalı.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ölçümü kaydet' })).toBeDisabled();
});

describe('Claude\'a sor', () => {
  test('özeti panoya kopyalar ve claude.ai bağlantısını gösterir', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    renderToday();
    await user.click(await screen.findByRole('button', { name: "Claude'a sor" }));
    expect(write).toHaveBeenCalledWith(expect.stringContaining('## Son 14 günün antrenmanları'));
    expect(await screen.findByText(/Kopyalandı/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "claude.ai'yi aç" })).toHaveAttribute('href', 'https://claude.ai/new');
  });
});

describe('antrenman kartı', () => {
  test('oturum yoksa sıradaki günü gösterir; Başla antrenmanı başlatır', async () => {
    const user = userEvent.setup();
    await repo.saveSession(done(addDays(today, -2), 'A'));
    const props = renderToday();
    expect(await screen.findByText('Sıradaki: Antrenman B (7 hareket)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Başla' }));
    expect(props.onStartWorkout).toHaveBeenCalled();
  });

  test('aktif oturum varsa Devam et gösterir', async () => {
    const user = userEvent.setup();
    await repo.saveSession({ ...done(today), status: 'active' });
    const props = renderToday();
    await user.click(await screen.findByRole('button', { name: 'Devam et' }));
    expect(props.onContinueWorkout).toHaveBeenCalled();
  });

  test('sıradaki antrenman kartında kaslı dost var (ilk gün: seviye 1, tombul)', async () => {
    renderToday();
    const card = (await screen.findByText('Sıradaki: Antrenman A (7 hareket)')).closest('section')!;
    expect(within(card).getByRole('img', { name: 'Kaslı dostun, seviye 1, tombul' })).toBeInTheDocument();
    expect(within(card).getByText('Sonraki seviyeye 3 antrenman')).toBeInTheDocument();
  });

  test('antrenman devam ederken de kaslı dost ve Devam et gösterilir', async () => {
    await repo.saveSession({ ...done(today, 'B'), status: 'active' });
    renderToday();
    const card = (await screen.findByText('Antrenman devam ediyor')).closest('section')!;
    expect(within(card).getByRole('img', { name: /^Kaslı dostun, seviye 1/ })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Devam et' })).toBeInTheDocument();
  });

  test('en üst seviyede kutlama yazısı', async () => {
    for (let i = 0; i < 27; i++) await repo.saveSession(done(addDays(today, -30 - i)));
    renderToday();
    const card = (await screen.findByText(/^Sıradaki: Antrenman/)).closest('section')!;
    expect(within(card).getByRole('img', { name: 'Kaslı dostun, seviye 10, kaslı' })).toBeInTheDocument();
    expect(within(card).getByText('En üst seviye! 🏆')).toBeInTheDocument();
  });

  test('bu hafta tamamlanan antrenman sayısını hedefle gösterir', async () => {
    await repo.saveSession(done(today));
    await repo.saveSession(done(today, 'B'));
    await repo.saveSession(done(addDays(weekStart(today), -1)));
    renderToday();
    expect(await screen.findByText('Bu hafta 2 / 3 antrenman')).toBeInTheDocument();
  });
});

describe('beslenme ve yedek', () => {
  test('bugünün kalori ve protein toplamını gösterir', async () => {
    await repo.addMeal({ date: today, time: '08:00', name: 'Yulaf', kcal: 300, protein: 10, carbs: 50, fat: 6 });
    await repo.addMeal({ date: addDays(today, -1), time: '08:00', name: 'Dün', kcal: 999, protein: 99, carbs: 0, fat: 0 });
    renderToday();
    expect(await screen.findByText('300 / 2200 kcal')).toBeInTheDocument();
    expect(screen.getByText('10 / 160 g')).toBeInTheDocument();
  });

  test('hiç yedek alınmamış ve kayıt varsa yedek hatırlatması Ayarlar\'ı açar', async () => {
    const user = userEvent.setup();
    await repo.addMeal({ date: today, time: '08:00', name: 'Yulaf', kcal: 300, protein: 10, carbs: 50, fat: 6 });
    const props = renderToday({ ...settings, lastBackup: null });
    await user.click(await screen.findByRole('button', { name: /Yedek alma zamanı/ }));
    expect(props.onOpenSettings).toHaveBeenCalled();
  });

  test('yeni yedek alınmışsa hatırlatma görünmez', async () => {
    await repo.addMeal({ date: today, time: '08:00', name: 'Yulaf', kcal: 300, protein: 10, carbs: 50, fat: 6 });
    renderToday();
    await screen.findByText('300 / 2200 kcal');
    expect(screen.queryByRole('button', { name: /Yedek alma zamanı/ })).not.toBeInTheDocument();
  });

  test('son yedek 30 gün önceyse hatırlatma görünür', async () => {
    renderToday({ ...settings, lastBackup: addDays(today, -30) });
    expect(await screen.findByRole('button', { name: /Yedek alma zamanı/ })).toBeInTheDocument();
  });
});
