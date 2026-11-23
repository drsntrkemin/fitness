import { num, signed, nowTime } from '../../src/domain/format';

test('num Türkçe ondalık virgül kullanır, binlik ayıracı koymaz', () => {
  expect(num(1950)).toBe('1950');
  expect(num(32.5)).toBe('32,5');
  expect(num(78.8 - 80)).toBe('-1,2');
});

test('signed farkı işaretiyle yazar (eksi için gerçek eksi işareti)', () => {
  expect(signed(78.8 - 80)).toBe('−1,2');
  expect(signed(2)).toBe('+2');
  expect(signed(0)).toBe('±0');
  expect(signed(0.04)).toBe('±0');
});

test('nowTime saat ve dakikayı iki haneli yazar', () => {
  expect(nowTime(new Date(2026, 10, 23, 7, 5))).toBe('07:05');
});
