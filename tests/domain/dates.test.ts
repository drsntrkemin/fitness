import { localDateKey, addDays, daysBetween } from '../../src/domain/dates';

test('testler Türkiye saat diliminde (UTC+3) çalışır', () => {
  expect(new Date(2026, 10, 24, 1, 30).getTimezoneOffset()).toBe(-180);
});

test('localDateKey gece yarısından sonra yerel günü verir, UTC gününü değil', () => {
  expect(localDateKey(new Date(2026, 10, 24, 1, 30))).toBe('2026-11-24');
});

test('localDateKey tek haneli ay ve günü sıfırla doldurur', () => {
  expect(localDateKey(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
});

test('addDays ay ve yıl sınırlarını doğru geçer', () => {
  expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  expect(addDays('2026-11-23', -7)).toBe('2026-11-16');
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
});

test('daysBetween b − a gün sayısını verir', () => {
  expect(daysBetween('2026-11-16', '2026-11-23')).toBe(7);
  expect(daysBetween('2026-11-23', '2026-11-16')).toBe(-7);
  expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
});

test('formatDay tarihi Türkçe kısa biçimde yazar', async () => {
  const { formatDay } = await import('../../src/domain/dates');
  expect(formatDay('2026-11-20')).toBe('20 Kas Cum');
  expect(formatDay('2026-11-23', { long: true })).toBe('23 Kasım Pazartesi');
});

test('weekStart haftanın Pazartesi gününü verir', async () => {
  const { weekStart } = await import('../../src/domain/dates');
  expect(weekStart('2026-11-23')).toBe('2026-11-23'); // Pazartesi
  expect(weekStart('2026-11-29')).toBe('2026-11-23'); // Pazar
  expect(weekStart('2026-11-25')).toBe('2026-11-23'); // Çarşamba
  expect(weekStart('2026-03-01')).toBe('2026-02-23'); // Pazar, ay sınırı
});
