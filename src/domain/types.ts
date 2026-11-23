/** Yerel takvim günü, 'YYYY-MM-DD'. Her zaman localDateKey ile üretilir. */
export type DateKey = string;

export type DayKey = 'A' | 'B';

/** Kullanıcının bir direnç bandı. Equipment.bands dizisi hafiften ağıra sıralıdır. */
export interface Band {
  id: string;
  name: string;
}

export interface Equipment {
  bands: Band[];
  /** İsveç merdivenindeki kademe sayısı; 1 = en alt kademe. */
  ladderRungs: number;
}

/** Bir hareketin zorluk merdivenindeki bir aşama; buildLadder bunu seviyelere açar. */
export type Stage =
  | { kind: 'fixed'; label: string }
  /** label içinde {band}; reversed: ağır banttan hafife (bant destekli barfiks). */
  | { kind: 'bands'; label: string; reversed?: boolean }
  /** label içinde {rung}; max: kullanılabilecek en yüksek kademe. */
  | { kind: 'rungs'; label: string; order: 'desc' | 'asc'; max?: number };

export interface ExerciseDef {
  id: string;
  name: string;
  day: DayKey;
  repMin: number;
  repMax: number;
  /** Tekrarlar her bacak/taraf için sayılır. */
  perSide?: boolean;
  /** Karın hareketi: haftada 2 günde de 3 set kalır. */
  core?: boolean;
  stages: Stage[];
  howTo: string;
}

export interface ExerciseOverride {
  repMin?: number;
  repMax?: number;
  sets?: number;
}

/** Bir hareketin koç durumu: merdivendeki seviye ve bir sonraki oturumun hedef tekrarı. */
export interface ExerciseState {
  level: number;
  targetReps: number;
  /** Üst üste kaç oturumda bir set alt sınırın altında kaldı. */
  failStreak: number;
}

export type ProgressEvent = 'none' | 'reps-up' | 'level-up' | 'level-down' | 'max-level' | 'skipped';
