import Dexie, { type Table } from 'dexie';
import type {
	DayPlan,
	DayPlanExercise,
	Exercise,
	PlannedWorkout,
	SessionExercise,
	Theme,
	Weekday,
	WorkoutEntryInput,
	WorkoutSession
} from '$lib/types';

class FitnessDatabase extends Dexie {
	themes!: Table<Theme, number>;
	exercises!: Table<Exercise, number>;
	dayPlans!: Table<DayPlan, Weekday>;
	dayPlanExercises!: Table<DayPlanExercise, number>;
	sessions!: Table<WorkoutSession, number>;
	sessionExercises!: Table<SessionExercise, number>;

	constructor() {
		super('fitness-db');

		this.version(1).stores({
			themes: '++id,name,createdAt',
			exercises: '++id,name,themeId,deletedAt,createdAt',
			dayPlans: 'day,themeId',
			dayPlanExercises: '++id,day,exerciseId,position',
			sessions: '++id,day,date,completedAt',
			sessionExercises: '++id,sessionId,exerciseId,performedAt,position'
		});
	}
}

export const db = new FitnessDatabase();

export async function listThemes(): Promise<Theme[]> {
	return db.themes.orderBy('name').toArray();
}

export async function addTheme(name: string): Promise<number> {
	const clean = name.trim();
	if (!clean) throw new Error('Theme name is required.');

	return db.themes.add({
		name: clean,
		createdAt: Date.now()
	});
}

export async function deleteTheme(themeId: number): Promise<void> {
	const isUsed = await db.dayPlans.where('themeId').equals(themeId).count();
	if (isUsed > 0) {
		throw new Error('This theme is still assigned to at least one day.');
	}

	await db.themes.delete(themeId);
}

export async function listExercises(): Promise<Exercise[]> {
	const exercises = (await db.exercises.toArray()).filter((exercise) => exercise.deletedAt === null);
	return exercises.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addExercise(name: string, themeId: number | null): Promise<number> {
	const clean = name.trim();
	if (!clean) throw new Error('Exercise name is required.');

	return db.exercises.add({
		name: clean,
		themeId,
		createdAt: Date.now(),
		deletedAt: null
	});
}

export async function softDeleteExercise(exerciseId: number): Promise<void> {
	const exercise = await db.exercises.get(exerciseId);
	if (!exercise) return;

	await db.exercises.update(exerciseId, { deletedAt: Date.now() });
}

export async function saveDayPlan(day: Weekday, themeId: number, orderedExerciseIds: number[]): Promise<void> {
	await db.transaction('rw', db.dayPlans, db.dayPlanExercises, async () => {
		await db.dayPlans.put({ day, themeId });
		await db.dayPlanExercises.where('day').equals(day).delete();

		if (orderedExerciseIds.length > 0) {
			await db.dayPlanExercises.bulkAdd(
				orderedExerciseIds.map((exerciseId, index) => ({
					day,
					exerciseId,
					position: index
				}))
			);
		}
	});
}

export async function getDayPlan(day: Weekday): Promise<PlannedWorkout | null> {
	const dayPlan = await db.dayPlans.get(day);
	if (!dayPlan) return null;

	const theme = await db.themes.get(dayPlan.themeId);
	if (!theme?.id) return null;

	const planRows = await db.dayPlanExercises.where('day').equals(day).sortBy('position');
	const exercises = await db.exercises.bulkGet(planRows.map((row) => row.exerciseId));

	const exerciseById = new Map<number, Exercise>();
	for (const item of exercises) {
		if (item?.id && item.deletedAt === null) {
			exerciseById.set(item.id, item);
		}
	}

	const ordered = planRows
		.map((row) => exerciseById.get(row.exerciseId))
		.filter((row): row is Exercise => Boolean(row));

	return {
		day,
		theme,
		exercises: ordered
	};
}

export async function getLastWeightsForExercises(
	exerciseIds: number[]
): Promise<Record<number, number | null>> {
	const result: Record<number, number | null> = {};

	await Promise.all(
		exerciseIds.map(async (exerciseId) => {
			const rows = await db.sessionExercises.where('exerciseId').equals(exerciseId).toArray();
			let latest: SessionExercise | null = null;

			for (const row of rows) {
				if (row.weight === null) continue;
				if (!latest || row.performedAt > latest.performedAt) {
					latest = row;
				}
			}

			result[exerciseId] = latest?.weight ?? null;
		})
	);

	return result;
}

export async function completeSession(
	day: Weekday,
	warmupCompleted: boolean,
	cooldownCompleted: boolean,
	entries: WorkoutEntryInput[]
): Promise<number> {
	const timestamp = Date.now();
	const isoDate = new Date(timestamp).toISOString().slice(0, 10);

	return db.transaction('rw', db.sessions, db.sessionExercises, async () => {
		const sessionId = await db.sessions.add({
			day,
			date: isoDate,
			completedAt: timestamp,
			warmupCompleted,
			cooldownCompleted
		});

		if (entries.length > 0) {
			await db.sessionExercises.bulkAdd(
				entries.map((entry) => ({
					sessionId,
					exerciseId: entry.exerciseId,
					exerciseName: entry.exerciseName,
					weight: entry.weight,
					previousWeight: entry.previousWeight,
					completed: entry.completed,
					position: entry.position,
					performedAt: timestamp
				}))
			);
		}

		return sessionId;
	});
}
