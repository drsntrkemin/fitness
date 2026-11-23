import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsScreen from '../../src/screens/Settings';
import * as repo from '../../src/data/repo';
import type { Settings } from '../../src/domain/types';

const base: Settings = {
  ...repo.DEFAULT_SETTINGS,
  setupDone: true,
  targets: { kcal: 2200, protein: 140, carbs: 220, fat: 70 },
  equipment: { bands: [{ id: 'b1', name: 'Kırmızı' }], ladderRungs: 10 },
};

beforeEach(async () => {
  await repo.resetAll();
  await repo.saveSettings(base);
  vi.restoreAllMocks();
});

function renderSettings(s: Settings = base) {
  const onChange = vi.fn();
  render(<SettingsScreen settings={s} onChange={onChange} onClose={() => {}} />);
  return { onChange };
}

test('protein hedefi değiştirilip kaydedilir', async () => {
  const user = userEvent.setup();
  const { onChange } = renderSettings();
  const protein = screen.getByLabelText('Protein (g)');
  await user.clear(protein);
  await user.type(protein, '160');
  await user.click(screen.getByRole('button', { name: 'Hedefleri kaydet' }));
  await vi.waitFor(async () => expect((await repo.getSettings()).targets?.protein).toBe(160));
  expect(onChange).toHaveBeenCalled();
});

test('haftalık gün sayısı 2 seçilince kaydedilir', async () => {
  const user = userEvent.setup();
  renderSettings();
  await user.click(screen.getByRole('radio', { name: 'Haftada 2 gün' }));
  await vi.waitFor(async () => expect((await repo.getSettings()).daysPerWeek).toBe(2));
});

test('hareket tekrar aralığında alt sınır üst sınırdan küçük olmalı', async () => {
  const user = userEvent.setup();
  renderSettings();
  const min = screen.getByLabelText('Bantlı squat en az tekrar');
  await user.clear(min);
  await user.type(min, '13');
  expect(screen.getByText('Bantlı squat: en az tekrar, en çok tekrardan küçük olmalı.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hareket ayarlarını kaydet' })).toBeDisabled();
  expect((await repo.getSettings()).overrides['band-squat']).toBeUndefined();
});

test('geçerli tekrar aralığı ve set sayısı kaydedilir', async () => {
  const user = userEvent.setup();
  renderSettings();
  const max = screen.getByLabelText('Bantlı squat en çok tekrar');
  await user.clear(max);
  await user.type(max, '15');
  const sets = screen.getByLabelText('Bantlı squat set sayısı');
  await user.clear(sets);
  await user.type(sets, '4');
  await user.click(screen.getByRole('button', { name: 'Hareket ayarlarını kaydet' }));
  await vi.waitFor(async () => expect((await repo.getSettings()).overrides['band-squat']).toEqual({ repMin: 8, repMax: 15, sets: 4 }));
  // Varsayılanında bırakılan hareketler için ayar yazılmaz.
  expect((await repo.getSettings()).overrides['pullup']).toBeUndefined();
});

test('geçersiz yedek dosyası yüklenmek istenince hata gösterilir ve veriler korunur', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  renderSettings();
  const file = new File(['{"foo":1}'], 'yedek.json', { type: 'application/json' });
  await user.upload(screen.getByLabelText('Yedek dosyası seç'), file);
  expect(await screen.findByText('Geçersiz yedek dosyası')).toBeInTheDocument();
  expect((await repo.getSettings()).setupDone).toBe(true);
});

test('geçerli yedek onaylanınca yüklenir', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const { exportAll } = await import('../../src/data/backup');
  await repo.addMeal({ date: '2026-11-23', time: '08:00', name: 'Yulaf', kcal: 300, protein: 10, carbs: 50, fat: 6 });
  const text = JSON.stringify(await exportAll());
  await repo.resetAll();
  const { onChange } = renderSettings();
  await user.upload(screen.getByLabelText('Yedek dosyası seç'), new File([text], 'yedek.json', { type: 'application/json' }));
  expect(await screen.findByText('Yedek yüklendi.')).toBeInTheDocument();
  expect(await repo.allMeals()).toHaveLength(1);
  expect(onChange).toHaveBeenCalled();
});

test('yedekle: dosya paylaşılır/indirilir ve son yedek tarihi güncellenir', async () => {
  const user = userEvent.setup();
  const ios = await import('../../src/platform/ios');
  const share = vi.spyOn(ios, 'shareFile').mockResolvedValue('shared');
  renderSettings();
  await user.click(screen.getByRole('button', { name: 'Yedekle' }));
  expect(share).toHaveBeenCalledWith(expect.stringMatching(/^ev-fitness-\d{4}-\d{2}-\d{2}\.json$/), expect.stringContaining('"app":"ev-fitness"'));
  await vi.waitFor(async () => expect((await repo.getSettings()).lastBackup).toMatch(/^\d{4}-\d{2}-\d{2}$/));
});

test('verileri sıfırla iki kez onay ister', async () => {
  const user = userEvent.setup();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(true).mockReturnValueOnce(false);
  renderSettings();
  await user.click(screen.getByRole('button', { name: 'Verileri sıfırla' }));
  expect(confirm).toHaveBeenCalledTimes(2);
  expect((await repo.getSettings()).setupDone).toBe(true);
});
