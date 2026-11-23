import Dexie, { type EntityTable } from 'dexie';
import type { ExerciseState, Meal, Measurement, Session, Settings } from '../domain/types';

export interface SettingsRow { key: 'main'; value: Settings }
export interface ExerciseStateRow extends ExerciseState { id: string }

export type FitnessDB = Dexie & {
  settings: EntityTable<SettingsRow, 'key'>;
  exerciseStates: EntityTable<ExerciseStateRow, 'id'>;
  sessions: EntityTable<Session, 'id'>;
  meals: EntityTable<Meal, 'id'>;
  measurements: EntityTable<Measurement, 'date'>;
};

export const db = new Dexie('ev-fitness') as FitnessDB;

db.version(1).stores({
  settings: 'key',
  exerciseStates: 'id',
  sessions: '++id, date, status',
  meals: '++id, date',
  measurements: 'date',
});
