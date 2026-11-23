import { render, screen, within } from '@testing-library/react';
import BodyMap from '../../src/components/BodyMap';
import MuscleChips from '../../src/components/MuscleChips';
import type { MuscleSet } from '../../src/domain/types';

const pullup: MuscleSet = { primary: ['lats', 'biceps'], secondary: ['upperBack', 'rearDelts', 'forearms'] };

test('ön ve arka figür çalışan kasları ekran okuyucuya söyler (ana önce)', () => {
  render(<BodyMap muscles={pullup} size={150} />);
  expect(screen.getByRole('img', { name: 'Ön: Biceps, Ön kol' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Arka: Kanat, Üst sırt, Arka omuz, Ön kol' })).toBeInTheDocument();
});

test('kas bölgeleri ana / yardımcı / boş durumunu taşır', () => {
  render(<BodyMap muscles={pullup} size={150} />);
  const back = screen.getByRole('img', { name: /^Arka/ });
  const front = screen.getByRole('img', { name: /^Ön/ });
  expect(back.querySelector('[data-muscle="lats"]')).toHaveAttribute('data-state', 'primary');
  expect(back.querySelector('[data-muscle="upperBack"]')).toHaveAttribute('data-state', 'secondary');
  expect(front.querySelector('[data-muscle="chest"]')).toHaveAttribute('data-state', 'idle');
});

test('baldır ön figürde çizilmez, arkada çizilir', () => {
  render(<BodyMap muscles={{ primary: ['calves'], secondary: [] }} size={150} />);
  expect(screen.getByRole('img', { name: /^Ön/ }).querySelector('[data-muscle="calves"]')).toBeNull();
  expect(screen.getByRole('img', { name: /^Arka/ }).querySelector('[data-muscle="calves"]')).toHaveAttribute('data-state', 'primary');
  expect(screen.getByRole('img', { name: 'Ön: çalışan kas yok' })).toBeInTheDocument();
});

test('büyük boyutta ÖN/ARKA yazar, küçükte yazmaz', () => {
  const { unmount } = render(<BodyMap muscles={pullup} size={150} />);
  expect(screen.getByText('ÖN')).toBeInTheDocument();
  unmount();
  render(<BodyMap muscles={pullup} size={90} />);
  expect(screen.queryByText('ÖN')).not.toBeInTheDocument();
});

test('etiketler: ana turuncu, yardımcı gri; istenirse yardımcılar gizlenir', () => {
  const { unmount } = render(<MuscleChips muscles={pullup} />);
  const list = screen.getByRole('list', { name: 'Çalışan kaslar' });
  expect(within(list).getByText('Kanat')).toHaveClass('chip-p');
  expect(within(list).getByText('Arka omuz')).toHaveClass('chip-s');
  unmount();
  render(<MuscleChips muscles={pullup} showSecondary={false} />);
  expect(screen.queryByText('Arka omuz')).not.toBeInTheDocument();
  expect(screen.getByText('Biceps')).toBeInTheDocument();
});

test('bel, kanat kaslarının altında çizilir (kanadı örtmez)', () => {
  render(<BodyMap muscles={{ primary: ['lats'], secondary: [] }} size={150} />);
  const groups = [...screen.getByRole('img', { name: /^Arka/ }).querySelectorAll('[data-muscle]')].map((g) => g.getAttribute('data-muscle'));
  expect(groups.indexOf('lowerBack')).toBeLessThan(groups.indexOf('lats'));
});
