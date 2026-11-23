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

/** Vücut figüründe çizilen kas bölgeleri. */
export type Muscle =
  | 'shoulders' | 'chest' | 'biceps' | 'forearms' | 'abs' | 'obliques' | 'quads'
  | 'traps' | 'rearDelts' | 'upperBack' | 'lats' | 'lowerBack' | 'triceps' | 'glutes' | 'hamstrings' | 'calves';

/** Bir hareketin (ya da günün) ana ve yardımcı kasları. */
export interface MuscleSet {
  primary: Muscle[];
  secondary: Muscle[];
}

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
  /** Yardımcı (izolasyon) hareket: günün sonunda süperset; haftada 2 günde de 3 set kalır. */
  accessory?: boolean;
  stages: Stage[];
  howTo: string;
  muscles: MuscleSet;
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

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal extends Macros {
  id?: number;
  date: DateKey;
  /** 'HH:MM' */
  time: string;
  name: string;
}

export type Targets = Macros;

export interface Settings {
  /** Günlük beslenme hedefleri; kurulumda atlanırsa null. */
  targets: Targets | null;
  daysPerWeek: 2 | 3;
  equipment: Equipment;
  /** hareketId → kullanıcının set/tekrar aralığı ayarı. */
  overrides: Record<string, ExerciseOverride>;
  lastBackup: DateKey | null;
  setupDone: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  /** Merdiven indeksi; -1 = başlangıç seviyesi henüz seçilmedi. */
  level: number;
  levelLabel: string;
  targetReps: number;
  /** null = set yapılmadı. */
  sets: (number | null)[];
}

export interface Session {
  id?: number;
  date: DateKey;
  day: DayKey;
  status: 'active' | 'done';
  exercises: SessionExercise[];
}

export interface Measurement {
  date: DateKey;
  weight: number | null;
  waist: number | null;
}

export interface BackupFile {
  app: 'ev-fitness';
  version: 1;
  exportedAt: string;
  settings: Settings;
  exerciseStates: Record<string, ExerciseState>;
  sessions: Session[];
  meals: Meal[];
  measurements: Measurement[];
}
