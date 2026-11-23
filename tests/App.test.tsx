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
