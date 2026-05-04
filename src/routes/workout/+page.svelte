<script lang="ts">
	import { COOLDOWN_MINUTES, DEFAULT_WEIGHT_UNIT, WARMUP_MINUTES } from '$lib/constants';
	import { completeSession, getDayPlan, getLastWeightsForExercises } from '$lib/db';
	import type { Weekday, WorkoutEntryInput } from '$lib/types';
	import { onMount } from 'svelte';

	interface WorkoutRow {
		exerciseId: number;
		exerciseName: string;
		previousWeight: number | null;
		weightText: string | number | null;
		completed: boolean;
	}

	let todayLabel = $state('');
	let todayTheme = $state('');
	let rows = $state<WorkoutRow[]>([]);
	let warmupCompleted = $state(false);
	let cooldownCompleted = $state(false);

	let statusMessage = $state('');
	let errorMessage = $state('');
	let emptyStateMessage = $state('');
	let isSaving = $state(false);
	let currentDay = $state<Weekday | null>(null);

	onMount(async () => {
		await loadTodaysWorkout();
	});

	async function loadTodaysWorkout() {
		statusMessage = '';
		errorMessage = '';
		emptyStateMessage = '';
		warmupCompleted = false;
		cooldownCompleted = false;

		const now = new Date();
		todayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
		const jsDay = now.getDay();

		if (jsDay === 0 || jsDay === 6) {
			currentDay = null;
			rows = [];
			emptyStateMessage = 'Weekend detected. Enjoy recovery, mobility, or a light walk.';
			return;
		}

		const mappedDay = jsDay as Weekday;
		currentDay = mappedDay;

		const plan = await getDayPlan(mappedDay);
		if (!plan) {
			rows = [];
			todayTheme = '';
			emptyStateMessage = 'No plan set for today yet. Build it from Setup.';
			return;
		}

		todayTheme = plan.theme.name;

		const exerciseIds = plan.exercises.map((exercise) => exercise.id ?? -1).filter((id) => id > 0);
		const previousWeights = await getLastWeightsForExercises(exerciseIds);

		rows = plan.exercises
			.filter((exercise) => exercise.id)
			.map((exercise) => ({
				exerciseId: exercise.id!,
				exerciseName: exercise.name,
				previousWeight: previousWeights[exercise.id!] ?? null,
				weightText: '',
				completed: false
			}));
	}

	function parsedWeight(weightText: string | number | null): number | null {
		if (weightText === null || weightText === undefined) return null;

		if (typeof weightText === 'number') {
			if (!Number.isFinite(weightText) || weightText <= 0) return null;
			return weightText;
		}

		const clean = weightText.trim();
		if (!clean) return null;

		const value = Number(clean);
		if (!Number.isFinite(value) || value <= 0) return null;
		return value;
	}

	async function finishSession() {
		errorMessage = '';
		statusMessage = '';

		if (!currentDay) {
			errorMessage = 'A workout session can only be saved on a configured weekday.';
			return;
		}

		if (rows.length === 0) {
			errorMessage = 'No exercises are loaded for today.';
			return;
		}

		isSaving = true;
		try {
			const entries: WorkoutEntryInput[] = rows.map((row, index) => ({
				exerciseId: row.exerciseId,
				exerciseName: row.exerciseName,
				weight: parsedWeight(row.weightText),
				previousWeight: row.previousWeight,
				completed: row.completed,
				position: index
			}));

			await completeSession(currentDay, warmupCompleted, cooldownCompleted, entries);
			statusMessage = 'Session saved. Next time, your latest weights will appear automatically.';
			await loadTodaysWorkout();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to save your session.';
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="page">
	<section class="card">
		<h1>Today&apos;s Workout</h1>
		<p>{todayLabel}</p>
		{#if todayTheme}
			<p style="margin-top: 0.5rem"><span class="chip">Theme: {todayTheme}</span></p>
		{/if}
	</section>

	{#if emptyStateMessage}
		<section class="card">
			<p>{emptyStateMessage}</p>
		</section>
	{:else}
		<section class="card">
			<div class="list-item">
				<div>
					<strong>Warmup</strong>
					<p class="muted">{WARMUP_MINUTES} minute cardio</p>
				</div>
				<label>
					<input type="checkbox" bind:checked={warmupCompleted} /> Done
				</label>
			</div>
		</section>

		<section class="card">
			<h2>Main Work</h2>
			<div class="list" style="margin-top: 0.7rem">
				{#each rows as row}
					<div class="list-item" style="align-items: flex-start">
						<div style="flex: 1">
							<strong>{row.exerciseName}</strong>
							<p class="muted">
								Last time:
								{#if row.previousWeight !== null}
									{row.previousWeight} {DEFAULT_WEIGHT_UNIT}
								{:else}
									No previous value
								{/if}
							</p>
							<div class="field-row" style="margin-top: 0.5rem">
								<input
									type="number"
									min="0"
									step="0.5"
									placeholder={`Weight (${DEFAULT_WEIGHT_UNIT})`}
									bind:value={row.weightText}
								/>
							</div>
						</div>
						<label>
							<input type="checkbox" bind:checked={row.completed} /> Done
						</label>
					</div>
				{/each}
			</div>
		</section>

		<section class="card">
			<div class="list-item">
				<div>
					<strong>Cooldown</strong>
					<p class="muted">{COOLDOWN_MINUTES} minute treadmill walk</p>
				</div>
				<label>
					<input type="checkbox" bind:checked={cooldownCompleted} /> Done
				</label>
			</div>
		</section>

		<section class="card">
			<div class="inline-row">
				<button class="secondary" disabled={isSaving} onclick={finishSession}>Save Session</button>
				<button class="ghost" disabled={isSaving} onclick={loadTodaysWorkout}>Refresh</button>
			</div>
			{#if statusMessage}
				<p class="success" style="margin-top: 0.7rem">{statusMessage}</p>
			{/if}
			{#if errorMessage}
				<p class="error" style="margin-top: 0.7rem">{errorMessage}</p>
			{/if}
		</section>
	{/if}
</div>
