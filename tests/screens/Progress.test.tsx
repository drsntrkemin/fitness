import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Progress from '../../src/screens/Progress';
import * as repo from '../../src/data/repo';
import { addDays, localDateKey } from '../../src/domain/dates';
import type { Settings } from '../../src/domain/types';

const today = localDateKey(new Date());
const settings: Settings = {
  ...structuredClone(repo.DEFAULT_SETTINGS),
  setupDone: true,
  targets: { kcal: 2200, protein: 160, carbs: 220, fat: 70 },
};

beforeEach(async () => { await repo.resetAll(); });

test('iki kilo ölçümünde ilk-son değer ve fark gösterilir', async () => {
  await repo.putMeasurement({ date: addDays(today, -7), weight: 80, waist: 92 });
  await repo.putMeasurement({ date: today, weight: 78.8, waist: null });
  render(<Progress settings={settings} />);
  const kilo = (await screen.findByRole('heading', { name: 'Kilo' })).closest('section')!;
  expect(within(kilo).getByText('−1,2 kg')).toBeInTheDocument();
  expect(within(kilo).getByText('80 → 78,8 kg')).toBeInTheDocument();
  expect(within(kilo).getByRole('img', { name: /Kilo grafiği/ })).toBeInTheDocument();
});

test('tek ölçümde grafik yerine uyarı gösterilir', async () => {
  await repo.putMeasurement({ date: addDays(today, -7), weight: 80, waist: 92 });
  await repo.putMeasurement({ date: today, weight: 78.8, waist: null });
  render(<Progress settings={settings} />);
  const bel = (await screen.findByRole('heading', { name: 'Bel' })).closest('section')!;
  expect(within(bel).getByText('Grafik için en az 2 ölçüm gerekli')).toBeInTheDocument();
});

test('ölçüm yoksa bunu söyler', async () => {
  render(<Progress settings={settings} />);
  const kilo = (await screen.findByRole('heading', { name: 'Kilo' })).closest('section')!;
  expect(within(kilo).getByText('Henüz ölçüm yok.')).toBeInTheDocument();
});

test('beslenme ortalaması 7/30 gün arasında değişir ve kayıtlı gün sayısını gösterir', async () => {
  const user = userEvent.setup();
  const meal = (date: string, kcal: number) => ({ date, time: '12:00', name: 'x', kcal, protein: 100, carbs: 0, fat: 0 });
  await repo.addMeal(meal(today, 2000));
  await repo.addMeal(meal(addDays(today, -1), 1800));
  await repo.addMeal(meal(addDays(today, -20), 3000));
  render(<Progress settings={settings} />);
  expect(await screen.findByText('1900 / 2200 kcal')).toBeInTheDocument();
  expect(screen.getByText('Son 7 günde 2 gün kayıt')).toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: '30 gün' }));
  expect(await screen.findByText('2267 / 2200 kcal')).toBeInTheDocument();
  expect(screen.getByText('Son 30 günde 3 gün kayıt')).toBeInTheDocument();
});

test('harekete dokununca geçmiş setleri görünür', async () => {
  const user = userEvent.setup();
  await repo.saveSession({ date: addDays(today, -3), day: 'A', status: 'done', exercises: [
    { exerciseId: 'pullup', level: 1, levelLabel: 'Bant destekli (Kırmızı)', targetReps: 6, sets: [6, 6, 5] },
  ] });
  await repo.saveSession({ date: today, day: 'B', status: 'active', exercises: [
    { exerciseId: 'pullup', level: 1, levelLabel: 'Bant destekli (Kırmızı)', targetReps: 6, sets: [9, 9, 9] },
  ] });
  render(<Progress settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Barfiks' }));
  const hist = screen.getByRole('list', { name: 'Barfiks geçmişi' });
  expect(within(hist).getByText('6, 6, 5')).toBeInTheDocument();
  expect(within(hist).getByText('Bant destekli (Kırmızı)')).toBeInTheDocument();
  expect(within(hist).queryByText('9, 9, 9')).not.toBeInTheDocument();
});

test('geçmişi olmayan hareket bunu söyler', async () => {
  const user = userEvent.setup();
  render(<Progress settings={settings} />);
  await user.click(await screen.findByRole('button', { name: 'Şınav' }));
  expect(screen.getByText('Bu hareket henüz kaydedilmedi.')).toBeInTheDocument();
});

test('ölçüm listeden silinebilir', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  await repo.putMeasurement({ date: addDays(today, -7), weight: 80, waist: 92 });
  await repo.putMeasurement({ date: today, weight: 785, waist: null });
  render(<Progress settings={settings} />);
  const list = await screen.findByRole('list', { name: 'Ölçümler' });
  const row = within(list).getByText('785 kg').closest('li')!;
  await user.click(within(row).getByRole('button', { name: 'Sil' }));
  await vi.waitFor(async () => expect(await repo.listMeasurements()).toHaveLength(1));
  expect(screen.queryByText('785 kg')).not.toBeInTheDocument();
});

test('ölçüm listeden düzeltilebilir', async () => {
  const user = userEvent.setup();
  await repo.putMeasurement({ date: today, weight: 785, waist: null });
  render(<Progress settings={settings} />);
  const list = await screen.findByRole('list', { name: 'Ölçümler' });
  await user.click(within(list).getByRole('button', { name: 'Düzelt' }));
  const kilo = within(list).getByLabelText('Kilo (kg)');
  await user.clear(kilo);
  await user.type(kilo, '78,5');
  await user.click(within(list).getByRole('button', { name: 'Kaydet' }));
  await vi.waitFor(async () => expect(await repo.listMeasurements()).toEqual([{ date: today, weight: 78.5, waist: null }]));
  expect(await within(list).findByText('78,5 kg')).toBeInTheDocument();
});
