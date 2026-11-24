import { render, screen, within } from '@testing-library/react';
import App from '../src/App';
import * as repo from '../src/data/repo';

beforeEach(async () => { await repo.resetAll(); });

test('kurulum tamamsa alt sekme çubuğu dört sekmeyi gösterir', async () => {
  await repo.saveSettings({ ...repo.DEFAULT_SETTINGS, setupDone: true });
  render(<App />);
  const nav = await screen.findByRole('navigation');
  for (const label of ['Bugün', 'Antrenman', 'Beslenme', 'İlerleme']) {
    expect(within(nav).getByText(label)).toBeInTheDocument();
  }
});

test('ilk açılışta kurulum sihirbazı gösterilir', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /Bantların/ })).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('Bugün ekranındaki Başla antrenman sekmesine geçip oturumu başlatır', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await repo.saveSettings({ ...repo.DEFAULT_SETTINGS, setupDone: true });
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Başla' }));
  expect(await screen.findByRole('heading', { name: 'Antrenman A' })).toBeInTheDocument();
  expect((await repo.getActiveSession())?.day).toBe('A');
  await user.click(screen.getByRole('button', { name: 'Bugün' }));
  expect(await screen.findByRole('button', { name: 'Devam et' })).toBeInTheDocument();
});

test('Bugün ekranındaki ⚙ ayarları açar, Kapat geri döner', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await repo.saveSettings({ ...repo.DEFAULT_SETTINGS, setupDone: true });
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Ayarlar' }));
  expect(await screen.findByRole('heading', { name: 'Ayarlar' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Kapat' }));
  expect(await screen.findByRole('navigation')).toBeInTheDocument();
});

test('Bugün ekranındaki "Seyahatte başla" seyahat antrenmanını açar', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await repo.saveSettings({ ...repo.DEFAULT_SETTINGS, setupDone: true });
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Seyahatte başla' }));
  expect(await screen.findByRole('heading', { name: 'Antrenman A · Seyahat' })).toBeInTheDocument();
});
