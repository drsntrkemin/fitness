import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import * as repo from '../../src/data/repo';

beforeEach(async () => { await repo.resetAll(); });

test('kurulum: bant ekle, kademe 8, hedefleri atla → ayarlar kaydedilir ve uygulama açılır', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('heading', { name: /Bantların/ });

  await user.type(screen.getByLabelText('Bant adı'), 'Kırmızı');
  await user.click(screen.getByRole('button', { name: 'Ekle' }));
  expect(screen.getByText('Kırmızı')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'İleri' }));

  const rungs = screen.getByLabelText('Kademe sayısı');
  expect(rungs).toHaveValue(10);
  await user.clear(rungs);
  await user.type(rungs, '8');
  await user.click(screen.getByRole('button', { name: 'İleri' }));

  await user.click(screen.getByRole('button', { name: 'Atla' }));

  expect(await screen.findByRole('navigation')).toBeInTheDocument();
  const s = await repo.getSettings();
  expect(s.equipment.bands.map((b) => b.name)).toEqual(['Kırmızı']);
  expect(s.equipment.ladderRungs).toBe(8);
  expect(s.targets).toBeNull();
  expect(s.setupDone).toBe(true);
});

test('kurulum: bantlar sıralanabilir ve silinebilir', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('heading', { name: /Bantların/ });
  for (const n of ['Sarı', 'Siyah', 'Kırmızı']) {
    await user.type(screen.getByLabelText('Bant adı'), n);
    await user.click(screen.getByRole('button', { name: 'Ekle' }));
  }
  await user.click(screen.getByRole('button', { name: 'Kırmızı yukarı taşı' }));
  await user.click(screen.getByRole('button', { name: 'Sarı sil' }));
  await user.click(screen.getByRole('button', { name: 'İleri' }));
  await user.click(screen.getByRole('button', { name: 'İleri' }));
  await user.click(screen.getByRole('button', { name: 'Atla' }));
  await screen.findByRole('navigation');
  expect((await repo.getSettings()).equipment.bands.map((b) => b.name)).toEqual(['Kırmızı', 'Siyah']);
});

test('kurulum: hedefler girilip bitirilirse kaydedilir; virgüllü sayı kabul edilir', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('heading', { name: /Bantların/ });
  await user.click(screen.getByRole('button', { name: 'İleri' }));
  await user.click(screen.getByRole('button', { name: 'İleri' }));
  await user.type(screen.getByLabelText('Kalori (kcal)'), '2200');
  await user.type(screen.getByLabelText('Protein (g)'), '160,5');
  await user.type(screen.getByLabelText('Karbonhidrat (g)'), '220');
  await user.type(screen.getByLabelText('Yağ (g)'), '70');
  await user.click(screen.getByRole('button', { name: 'Bitir' }));
  await screen.findByRole('navigation');
  expect((await repo.getSettings()).targets).toEqual({ kcal: 2200, protein: 160.5, carbs: 220, fat: 70 });
});

test('kurulum: eksik hedefle Bitir pasiftir', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('heading', { name: /Bantların/ });
  await user.click(screen.getByRole('button', { name: 'İleri' }));
  await user.click(screen.getByRole('button', { name: 'İleri' }));
  await user.type(screen.getByLabelText('Kalori (kcal)'), '2200');
  expect(screen.getByRole('button', { name: 'Bitir' })).toBeDisabled();
});
