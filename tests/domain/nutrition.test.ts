import { dayTotals, frequentMeals, averages } from '../../src/domain/nutrition';
import type { Meal } from '../../src/domain/types';

const meal = (date: string, name: string, kcal: number, protein = 0, carbs = 0, fat = 0, time = '08:00'): Meal =>
  ({ date, time, name, kcal, protein, carbs, fat });

describe('dayTotals', () => {
  test('öğünlerin kalori ve makrolarını toplar', () => {
    expect(dayTotals([meal('2026-11-23', 'Yulaf', 300, 10.2, 50, 6), meal('2026-11-23', 'Tavuk', 450, 32.5, 0, 12)]))
      .toEqual({ kcal: 750, protein: 42.7, carbs: 50, fat: 18 });
  });

  test('öğün yoksa sıfır döner', () => {
    expect(dayTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('frequentMeals', () => {
  test('en sık girilen öğün başta gelir', () => {
    const meals = [
      meal('2026-11-20', 'Yulaf', 300, 10),
      meal('2026-11-21', 'Yulaf', 300, 10),
      meal('2026-11-22', 'Yulaf', 300, 10),
      meal('2026-11-22', 'Yumurta', 150, 12),
    ];
    const list = frequentMeals(meals);
    expect(list.map((m) => m.name)).toEqual(['Yulaf', 'Yumurta']);
    expect(list[0]).toEqual({ name: 'Yulaf', kcal: 300, protein: 10, carbs: 0, fat: 0 });
  });

  test('adı boş öğünler listede yer almaz', () => {
    expect(frequentMeals([meal('2026-11-22', '  ', 500)])).toEqual([]);
  });

  test('büyük/küçük harf farkı (Türkçe İ dahil) aynı öğün sayılır, en son yazım gösterilir', () => {
    const list = frequentMeals([
      meal('2026-11-20', 'YULAF', 300), meal('2026-11-21', 'yulaf', 300),
      meal('2026-11-20', 'İRMİK', 200), meal('2026-11-22', 'irmik', 200), meal('2026-11-22', 'irmik', 200),
    ]);
    expect(list.map((m) => m.name)).toEqual(['irmik', 'yulaf']);
  });

  test('aynı ad farklı değerlerle ayrı öğün sayılır', () => {
    expect(frequentMeals([meal('2026-11-20', 'Yulaf', 300), meal('2026-11-21', 'Yulaf', 400)])).toHaveLength(2);
  });

  test('eşit sayıda girilenlerde en son girilen önce gelir ve limit uygulanır', () => {
    const list = frequentMeals([meal('2026-11-20', 'Elma', 80), meal('2026-11-22', 'Muz', 100), meal('2026-11-21', 'Armut', 90)], 2);
    expect(list.map((m) => m.name)).toEqual(['Muz', 'Armut']);
  });
});

describe('averages', () => {
  test('sadece kayıt girilen günlerin ortalamasını alır', () => {
    const meals = [
      meal('2026-11-17', 'a', 1200, 80), meal('2026-11-17', 'b', 800, 40),
      meal('2026-11-20', 'c', 1800, 150),
    ];
    expect(averages(meals, '2026-11-17', '2026-11-23'))
      .toEqual({ avg: { kcal: 1900, protein: 135, carbs: 0, fat: 0 }, loggedDays: 2 });
  });

  test('aralık dışındaki öğünleri saymaz (iki uç dahil)', () => {
    const meals = [meal('2026-11-16', 'x', 5000), meal('2026-11-17', 'y', 2000), meal('2026-11-23', 'z', 1000), meal('2026-11-24', 'w', 5000)];
    expect(averages(meals, '2026-11-17', '2026-11-23')).toEqual({ avg: { kcal: 1500, protein: 0, carbs: 0, fat: 0 }, loggedDays: 2 });
  });

  test('kayıt yoksa sıfır ve 0 gün', () => {
    expect(averages([], '2026-11-17', '2026-11-23')).toEqual({ avg: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, loggedDays: 0 });
  });
});
