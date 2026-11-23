import { validateMeasurement } from '../../src/domain/measure';

test('geçerli kilo ve bel (virgüllü) kabul edilir', () => {
  expect(validateMeasurement('78,5', '90')).toEqual({ ok: true, weight: 78.5, waist: 90 });
});

test('ikisinden biri boş kalabilir', () => {
  expect(validateMeasurement('78,5', '')).toEqual({ ok: true, weight: 78.5, waist: null });
  expect(validateMeasurement('', '90')).toEqual({ ok: true, weight: null, waist: 90 });
});

test('akla yatkın olmayan değerler reddedilir', () => {
  expect(validateMeasurement('785', '')).toEqual({ ok: false, error: 'Kilo 25–300 kg arasında olmalı.' });
  expect(validateMeasurement('', '9')).toEqual({ ok: false, error: 'Bel 40–200 cm arasında olmalı.' });
});

test('geçersiz yazım ve ikisi birden boş reddedilir', () => {
  expect(validateMeasurement('abc', '')).toEqual({ ok: false, error: 'Geçerli bir sayı gir.' });
  expect(validateMeasurement('', '')).toEqual({ ok: false, error: null });
});
