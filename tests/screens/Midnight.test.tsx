import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Nutrition from '../../src/screens/Nutrition';
import Today from '../../src/screens/Today';
import * as repo from '../../src/data/repo';
import type { Settings } from '../../src/domain/types';

const settings: Settings = {
  ...structuredClone(repo.DEFAULT_SETTINGS),
  setupDone: true,
  lastBackup: '2026-11-23',
  targets: { kcal: 2200, protein: 160, carbs: 220, fat: 70 },
};

beforeEach(async () => {
  await repo.resetAll();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 23, 22, 0));
});
afterEach(() => { vi.useRealTimers(); });

const wakeUp = () => act(() => { fireEvent(document, new Event('visibilitychange')); });

test('Beslenme gece açık kalıp sabah kullanılırsa öğün yeni güne yazılır', async () => {
  const user = userEvent.setup();
  render(<Nutrition settings={settings} />);
  await screen.findByText('Bu gün için öğün yok.');
  vi.setSystemTime(new Date(2026, 10, 24, 8, 0));
  wakeUp();
  await user.click(screen.getByRole('button', { name: '+ Öğün ekle' }));
  await user.type(screen.getByLabelText('Kalori (kcal)'), '400');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  await vi.waitFor(async () => expect((await repo.allMeals())[0]?.date).toBe('2026-11-24'));
  expect(screen.getByText('Bugün')).toBeInTheDocument();
});

test('Beslenmede geçmiş bir güne bakılıyorsa gün değişince o gün korunur', async () => {
  const user = userEvent.setup();
  render(<Nutrition settings={settings} />);
  await screen.findByText('Bu gün için öğün yok.');
  await user.click(screen.getByRole('button', { name: 'Önceki gün' }));
  await screen.findByText('Dün');
  vi.setSystemTime(new Date(2026, 10, 24, 8, 0));
  wakeUp();
  // 22 Kasım artık "Dün" değil, tarihiyle gösterilir; seçili gün değişmez.
  expect(await screen.findByText('22 Kas Paz')).toBeInTheDocument();
});

test('Bugün ekranı uyanınca yeni günün tarihini gösterir', async () => {
  render(<Today settings={settings} onOpenSettings={() => {}} onStartWorkout={() => {}} onContinueWorkout={() => {}} />);
  await screen.findByRole('heading', { name: '23 Kasım Pazartesi' });
  vi.setSystemTime(new Date(2026, 10, 24, 8, 0));
  wakeUp();
  expect(await screen.findByRole('heading', { name: '24 Kasım Salı' })).toBeInTheDocument();
});

test('ölçüm kartı kaydedildiği andaki günü kullanır', async () => {
  const user = userEvent.setup();
  render(<Today settings={settings} onOpenSettings={() => {}} onStartWorkout={() => {}} onContinueWorkout={() => {}} />);
  await screen.findByRole('heading', { name: 'Haftalık ölçüm' });
  vi.setSystemTime(new Date(2026, 10, 24, 0, 10));
  await user.type(screen.getByLabelText('Kilo (kg)'), '78,4');
  await user.click(screen.getByRole('button', { name: 'Ölçümü kaydet' }));
  await vi.waitFor(async () => expect((await repo.listMeasurements())[0]?.date).toBe('2026-11-24'));
});
