import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Nutrition from '../../src/screens/Nutrition';
import * as repo from '../../src/data/repo';
import { addDays, localDateKey } from '../../src/domain/dates';
import type { Settings } from '../../src/domain/types';

const settings: Settings = {
  ...structuredClone(repo.DEFAULT_SETTINGS),
  setupDone: true,
  targets: { kcal: 2200, protein: 160, carbs: 220, fat: 70 },
};
const today = localDateKey(new Date());
const yulaf = (date: string) => ({ date, time: '08:00', name: 'Yulaf', kcal: 300, protein: 10, carbs: 50, fat: 6 });

beforeEach(async () => {
  await repo.resetAll();
  vi.restoreAllMocks();
});

test('öğün eklenir: virgüllü protein kabul edilir, toplam ve liste güncellenir', async () => {
  const user = userEvent.setup();
  render(<Nutrition settings={settings} />);
  await user.click(await screen.findByRole('button', { name: '+ Öğün ekle' }));
  await user.type(screen.getByLabelText('Ad (isteğe bağlı)'), 'Tavuk');
  await user.type(screen.getByLabelText('Kalori (kcal)'), '450');
  await user.type(screen.getByLabelText('Protein (g)'), '32,5');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  expect(await screen.findByText('32,5 / 160 g')).toBeInTheDocument();
  expect(screen.getByText('450 / 2200 kcal')).toBeInTheDocument();
  expect(screen.getByText('Tavuk')).toBeInTheDocument();
  const [meal] = await repo.allMeals();
  expect(meal).toMatchObject({ date: today, name: 'Tavuk', kcal: 450, protein: 32.5, carbs: 0, fat: 0 });
  expect(meal.time).toMatch(/^\d{2}:\d{2}$/);
});

test('kalori boşken ya da geçersiz sayı varken Kaydet pasif', async () => {
  const user = userEvent.setup();
  render(<Nutrition settings={settings} />);
  await user.click(await screen.findByRole('button', { name: '+ Öğün ekle' }));
  expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled();
  await user.type(screen.getByLabelText('Kalori (kcal)'), '450');
  expect(screen.getByRole('button', { name: 'Kaydet' })).toBeEnabled();
  await user.type(screen.getByLabelText('Protein (g)'), 'abc');
  expect(screen.getByLabelText('Protein (g)')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('button', { name: 'Kaydet' })).toBeDisabled();
});

test('sık yenen öğün çipine dokununca bugüne tekrar eklenir', async () => {
  const user = userEvent.setup();
  await repo.addMeal(yulaf(addDays(today, -1)));
  render(<Nutrition settings={settings} />);
  await user.click(await screen.findByRole('button', { name: '+ Öğün ekle' }));
  await user.click(await screen.findByRole('button', { name: 'Yulaf · 300 kcal' }));
  await vi.waitFor(async () => expect(await repo.listMeals(today, today)).toHaveLength(1));
  expect(await repo.allMeals()).toHaveLength(2);
  expect(await screen.findByText('300 / 2200 kcal')).toBeInTheDocument();
});

test('öğüne dokununca düzenlenir; düzenlemede silinebilir', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  await repo.addMeal(yulaf(today));
  render(<Nutrition settings={settings} />);
  await user.click(await screen.findByRole('button', { name: /Yulaf/ }));
  const kcal = screen.getByLabelText('Kalori (kcal)');
  expect(kcal).toHaveValue('300');
  await user.clear(kcal);
  await user.type(kcal, '350');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  expect(await screen.findByText('350 / 2200 kcal')).toBeInTheDocument();
  expect((await repo.allMeals())[0].kcal).toBe(350);
  await user.click(screen.getByRole('button', { name: /Yulaf/ }));
  await user.click(screen.getByRole('button', { name: 'Sil' }));
  await vi.waitFor(async () => expect(await repo.allMeals()).toEqual([]));
  expect(await screen.findByText('Bu gün için öğün yok.')).toBeInTheDocument();
});

test('gün seçici önceki güne gider; bugünden ileri gidilemez', async () => {
  const user = userEvent.setup();
  await repo.addMeal(yulaf(addDays(today, -1)));
  render(<Nutrition settings={settings} />);
  expect(await screen.findByText('Bugün')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sonraki gün' })).toBeDisabled();
  expect(screen.getByText('Bu gün için öğün yok.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Önceki gün' }));
  expect(await screen.findByText('Dün')).toBeInTheDocument();
  expect(within(screen.getByRole('list', { name: 'Öğünler' })).getByText('Yulaf')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sonraki gün' })).toBeEnabled();
});

test('hedef girilmemişse sadece toplam gösterilir', async () => {
  await repo.addMeal(yulaf(today));
  render(<Nutrition settings={{ ...settings, targets: null }} />);
  expect(await screen.findByText('300 kcal')).toBeInTheDocument();
  expect(screen.getByText('10 g')).toBeInTheDocument();
});
