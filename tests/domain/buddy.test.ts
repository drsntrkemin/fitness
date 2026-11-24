import { buddyLevel, buddyPhase, buddyShape } from '../../src/domain/buddy';

test('seviye her 3 antrenmanda bir artar, 1 ile 10 arasında kalır', () => {
  expect(buddyLevel(0)).toEqual({ level: 1, completed: 0, toNext: 3, progress: 0 });
  expect(buddyLevel(2)).toMatchObject({ level: 1, toNext: 1 });
  expect(buddyLevel(3)).toMatchObject({ level: 2, toNext: 3, progress: 0 });
  expect(buddyLevel(11)).toMatchObject({ level: 4, toNext: 1 });
  expect(buddyLevel(11).progress).toBeCloseTo(2 / 3);
  expect(buddyLevel(27)).toEqual({ level: 10, completed: 27, toNext: null, progress: 1 });
  expect(buddyLevel(80).level).toBe(10);
});

test('evre: 1–3 tombul, 4–5 fit, 6–10 kaslı', () => {
  expect([1, 2, 3, 4, 5, 6, 10].map(buddyPhase)).toEqual(['tombul', 'tombul', 'tombul', 'fit', 'fit', 'kaslı', 'kaslı']);
});

test('göbek 1→3 küçülür, 4+ yok', () => {
  const b = [1, 2, 3, 4].map((l) => buddyShape(l).belly);
  expect(b[0]).toBeGreaterThan(b[1]);
  expect(b[1]).toBeGreaterThan(b[2]);
  expect(b[2]).toBeGreaterThan(0);
  expect(b[3]).toBe(0);
});

test('kaslar fit evresinden sonra büyür', () => {
  const s = (l: number) => buddyShape(l);
  expect(s(4).muscle).toBe(0);
  expect(s(5).muscle).toBe(0);
  expect(s(6).muscle).toBeGreaterThan(0);
  expect(s(10).muscle).toBe(1);
  expect(s(10).biceps).toBeGreaterThan(s(6).biceps);
  expect(s(6).biceps).toBeGreaterThan(s(5).biceps);
  expect(s(10).shoulder).toBeGreaterThan(s(5).shoulder);
});

test('ayrıntılar: 7+ göğüs çizgisi, 8+ karın kası, 10 parıltı', () => {
  expect([6, 7].map((l) => buddyShape(l).chestLines)).toEqual([false, true]);
  expect([7, 8].map((l) => buddyShape(l).abs)).toEqual([false, true]);
  expect([9, 10].map((l) => buddyShape(l).sparkles)).toEqual([false, true]);
});
