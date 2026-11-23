import { parseDecimal } from '../../src/domain/parse';

test('ondalık virgülü kabul eder', () => {
  expect(parseDecimal('72,5')).toBe(72.5);
});

test('ondalık noktayı kabul eder ve boşlukları kırpar', () => {
  expect(parseDecimal('72.5')).toBe(72.5);
  expect(parseDecimal(' 80 ')).toBe(80);
  expect(parseDecimal('0')).toBe(0);
});

test('boş, sayı olmayan, kısmen sayı ve negatif girişleri reddeder', () => {
  expect(parseDecimal('')).toBeNull();
  expect(parseDecimal('   ')).toBeNull();
  expect(parseDecimal('abc')).toBeNull();
  expect(parseDecimal('12abc')).toBeNull();
  expect(parseDecimal('1,5,3')).toBeNull();
  expect(parseDecimal('-3')).toBeNull();
});
