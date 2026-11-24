import { render, screen } from '@testing-library/react';
import Buddy from '../../src/components/Buddy';

const part = (name: string) => screen.getByRole('img').querySelector(`[data-part="${name}"]`);

test('ekran okuyucu seviyeyi ve evreyi söyler', () => {
  render(<Buddy level={1} size={100} />);
  expect(screen.getByRole('img', { name: 'Kaslı dostun, seviye 1, tombul' })).toBeInTheDocument();
});

test('1. seviyede göbek var, 4. seviyede yok', () => {
  const { unmount } = render(<Buddy level={1} size={100} />);
  expect(part('belly')).not.toBeNull();
  unmount();
  render(<Buddy level={4} size={100} />);
  expect(part('belly')).toBeNull();
  expect(screen.getByRole('img', { name: 'Kaslı dostun, seviye 4, fit' })).toBeInTheDocument();
});

test('8. seviyede karın kası, 10. seviyede parıltı', () => {
  const { unmount } = render(<Buddy level={8} size={100} />);
  expect(part('abs')).not.toBeNull();
  expect(part('sparkles')).toBeNull();
  unmount();
  render(<Buddy level={10} size={100} />);
  expect(part('sparkles')).not.toBeNull();
  expect(screen.getByRole('img', { name: 'Kaslı dostun, seviye 10, kaslı' })).toBeInTheDocument();
});
