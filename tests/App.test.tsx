import { render, screen, within } from '@testing-library/react';
import App from '../src/App';

test('alt sekme çubuğu dört sekmeyi gösterir', () => {
  render(<App />);
  const nav = screen.getByRole('navigation');
  for (const label of ['Bugün', 'Antrenman', 'Beslenme', 'İlerleme']) {
    expect(within(nav).getByText(label)).toBeInTheDocument();
  }
});
