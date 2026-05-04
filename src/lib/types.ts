export type Weekday = 1 | 2 | 3 | 4 | 5;

export interface Theme {
	id?: number;
	name: string;
	createdAt: number;
}

export interface Exercise {
	id?: number;
	name: string;
	themeId: number | null;
	createdAt: number;
	deletedAt: number | null;
}

export interface DayPlan {
	day: Weekday;
	themeId: number;
}

export interface DayPlanExercise {
	id?: number;
	day: Weekday;
	exerciseId: number;
	position: number;
}

export interface WorkoutSession {
	id?: number;
	day: Weekday;
	date: string;
	completedAt: number;
	warmupCompleted: boolean;
	cooldownCompleted: boolean;
}

export interface SessionExercise {
	id?: number;
	sessionId: number;
	exerciseId: number;
	exerciseName: string;
	weight: number | null;
	previousWeight: number | null;
	completed: boolean;
	position: number;
	performedAt: number;
}

export interface PlannedWorkout {
	day: Weekday;
	theme: Theme;
	exercises: Exercise[];
}

export interface WorkoutEntryInput {
	exerciseId: number;
	exerciseName: string;
	weight: number | null;
	previousWeight: number | null;
	completed: boolean;
	position: number;
}
