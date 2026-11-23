import { EXERCISES } from '../../src/domain/catalog';
import {
  buildLadder, clampLevel, setsFor, repRange, exercisesFor, nextDay,
} from '../../src/domain/program';
import type { Equipment } from '../../src/domain/types';

const eq: Equipment = {
  bands: [
    { id: 'b1', name: 'Sarı' },
    { id: 'b2', name: 'Kırmızı' },
    { id: 'b3', name: 'Siyah' },
  ],
  ladderRungs: 5,
};
const ex = (id: string) => {
  const found = EXERCISES.find((e) => e.id === id);
  if (!found) throw new Error(`katalogda yok: ${id}`);
  return found;
};

describe('katalog', () => {
  test('A ve B günleri spec sırasıyla beşer hareket içerir', () => {
    expect(exercisesFor('A').map((e) => e.id)).toEqual(
      ['pullup', 'pushup', 'band-squat', 'band-rdl', 'hanging-raise']);
    expect(exercisesFor('B').map((e) => e.id)).toEqual(
      ['inverted-row', 'band-press', 'band-lunge', 'band-hip-thrust', 'band-pallof']);
  });

  test('barfiks 4–8, diğerleri 8–12 tekrar aralığında', () => {
    for (const e of EXERCISES) {
      expect([e.repMin, e.repMax]).toEqual(e.id === 'pullup' ? [4, 8] : [8, 12]);
    }
  });

  test('her hareketin Türkçe bir nasıl-yapılır notu var', () => {
    for (const e of EXERCISES) expect(e.howTo.length).toBeGreaterThan(20);
  });
});

describe('buildLadder', () => {
  test('barfiks: negatif, bant destekli ağırdan hafife, tam, tempolu', () => {
    expect(buildLadder(ex('pullup'), eq)).toEqual([
      'Negatif barfiks (yavaş iniş)',
      'Bant destekli (Siyah)',
      'Bant destekli (Kırmızı)',
      'Bant destekli (Sarı)',
      'Tam barfiks',
      'Yavaş tempolu barfiks (3 sn iniş)',
    ]);
  });

  test('şınav: eğimli üstten alta, yer şınavı, ayaklar merdivende en fazla 3. kademe', () => {
    const ladder = buildLadder(ex('pushup'), eq);
    expect(ladder).toHaveLength(5 + 1 + 3);
    expect(ladder[0]).toBe('Eğimli şınav – 5. kademe');
    expect(ladder[4]).toBe('Eğimli şınav – 1. kademe');
    expect(ladder[5]).toBe('Yer şınavı');
    expect(ladder[6]).toBe('Ayaklar merdivende – 1. kademe');
    expect(ladder[8]).toBe('Ayaklar merdivende – 3. kademe');
  });

  test('ters row üst kademeden alta iner', () => {
    expect(buildLadder(ex('inverted-row'), eq)).toEqual([
      'Ters row – 5. kademe', 'Ters row – 4. kademe', 'Ters row – 3. kademe',
      'Ters row – 2. kademe', 'Ters row – 1. kademe',
    ]);
  });

  test('bantlı hareket bantları hafiften ağıra sıralar', () => {
    expect(buildLadder(ex('band-squat'), eq)).toEqual([
      'Bantlı squat (Sarı)', 'Bantlı squat (Kırmızı)', 'Bantlı squat (Siyah)',
    ]);
  });

  test('lunge vücut ağırlığıyla başlar, sonra bantlara geçer', () => {
    expect(buildLadder(ex('band-lunge'), eq)[0]).toBe('Geri lunge (vücut ağırlığı)');
    expect(buildLadder(ex('band-lunge'), eq)).toHaveLength(4);
  });

  test('bant yoksa bantlı hareket "Vücut ağırlığı" seviyesine düşer', () => {
    expect(buildLadder(ex('band-squat'), { bands: [], ladderRungs: 5 })).toEqual(['Vücut ağırlığı']);
  });

  test('bant yoksa barfiks bant destekli aşamayı atlar', () => {
    expect(buildLadder(ex('pullup'), { bands: [], ladderRungs: 5 })).toEqual([
      'Negatif barfiks (yavaş iniş)', 'Tam barfiks', 'Yavaş tempolu barfiks (3 sn iniş)',
    ]);
  });

  test('kademe sayısı 2 ise ayaklar merdivende aşaması 2 kademeyle sınırlı', () => {
    expect(buildLadder(ex('pushup'), { bands: [], ladderRungs: 2 })).toHaveLength(2 + 1 + 2);
  });
});

describe('clampLevel', () => {
  test('merdiven dışına taşan seviyeyi sınırlar', () => {
    expect(clampLevel(7, 3)).toBe(2);
    expect(clampLevel(-1, 3)).toBe(0);
    expect(clampLevel(1, 3)).toBe(1);
  });
});

describe('setsFor ve repRange', () => {
  test('haftada 2 günde ana hareketler 4, karın hareketleri 3 set', () => {
    expect(setsFor(ex('band-squat'), 2)).toBe(4);
    expect(setsFor(ex('band-pallof'), 2)).toBe(3);
    expect(setsFor(ex('hanging-raise'), 2)).toBe(3);
    expect(setsFor(ex('band-squat'), 3)).toBe(3);
  });

  test('kullanıcı ayarı set sayısını ve aralığı ezer', () => {
    expect(setsFor(ex('band-squat'), 3, { sets: 5 })).toBe(5);
    expect(repRange(ex('band-squat'))).toEqual({ repMin: 8, repMax: 12 });
    expect(repRange(ex('band-squat'), { repMin: 10, repMax: 15 })).toEqual({ repMin: 10, repMax: 15 });
    expect(repRange(ex('band-squat'), { repMax: 15 })).toEqual({ repMin: 8, repMax: 15 });
  });
});

describe('nextDay', () => {
  test('A/B dönüşümlü, başlangıç A', () => {
    expect(nextDay(null)).toBe('A');
    expect(nextDay('A')).toBe('B');
    expect(nextDay('B')).toBe('A');
  });
});
