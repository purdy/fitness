<script lang="ts">
	import {
		addExercise,
		addTheme,
		deleteTheme,
		getDayPlan,
		listExercises,
		listThemes,
		saveDayPlan,
		softDeleteExercise,
		updateExercise,
		updateTheme
	} from '$lib/db';
	import { WEEKDAYS } from '$lib/constants';
	import type { Exercise, Theme, Weekday } from '$lib/types';
	import { onMount } from 'svelte';

	let themes = $state<Theme[]>([]);
	let exercises = $state<Exercise[]>([]);

	let newThemeName = $state('');
	let newExerciseName = $state('');
	let newExerciseThemeId = $state<string>('');
	let editingThemeId = $state<number | null>(null);
	let editThemeName = $state('');
	let editingExerciseId = $state<number | null>(null);
	let editExerciseName = $state('');
	let editExerciseThemeId = $state<string>('');

	let selectedDay = $state<Weekday>(1);
	let selectedThemeId = $state<string>('');
	let selectedExerciseIds = $state<number[]>([]);

	let statusMessage = $state('');
	let errorMessage = $state('');

	onMount(async () => {
		await refreshAll();
	});

	async function refreshAll() {
		themes = await listThemes();
		exercises = await listExercises();
		await loadDayPlan(selectedDay);
	}

	async function loadDayPlan(day: Weekday) {
		const plan = await getDayPlan(day);
		selectedThemeId = plan?.theme?.id ? String(plan.theme.id) : '';
		selectedExerciseIds = plan?.exercises.map((exercise) => exercise.id ?? -1).filter((id) => id !== -1) ?? [];
	}

	async function createTheme() {
		errorMessage = '';
		statusMessage = '';
		try {
			await addTheme(newThemeName);
			newThemeName = '';
			await refreshAll();
			statusMessage = 'Theme added.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to add theme.';
		}
	}

	async function removeTheme(themeId: number) {
		errorMessage = '';
		statusMessage = '';
		try {
			await deleteTheme(themeId);
			if (editingThemeId === themeId) {
				cancelThemeEdit();
			}
			await refreshAll();
			statusMessage = 'Theme deleted.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to delete theme.';
		}
	}

	function startThemeEdit(theme: Theme) {
		if (!theme.id) return;
		editingThemeId = theme.id;
		editThemeName = theme.name;
		errorMessage = '';
		statusMessage = '';
	}

	function cancelThemeEdit() {
		editingThemeId = null;
		editThemeName = '';
	}

	async function saveThemeEdit(themeId: number) {
		errorMessage = '';
		statusMessage = '';

		try {
			await updateTheme(themeId, editThemeName);
			cancelThemeEdit();
			await refreshAll();
			statusMessage = 'Theme updated.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to update theme.';
		}
	}

	async function createExercise() {
		errorMessage = '';
		statusMessage = '';
		try {
			await addExercise(newExerciseName, newExerciseThemeId ? Number(newExerciseThemeId) : null);
			newExerciseName = '';
			newExerciseThemeId = '';
			await refreshAll();
			statusMessage = 'Exercise added.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to add exercise.';
		}
	}

	async function removeExercise(exerciseId: number) {
		errorMessage = '';
		statusMessage = '';
		await softDeleteExercise(exerciseId);
		if (editingExerciseId === exerciseId) {
			cancelExerciseEdit();
		}
		await refreshAll();
		statusMessage = 'Exercise archived.';
	}

	function startExerciseEdit(exercise: Exercise) {
		if (!exercise.id) return;
		editingExerciseId = exercise.id;
		editExerciseName = exercise.name;
		editExerciseThemeId = exercise.themeId ? String(exercise.themeId) : '';
		errorMessage = '';
		statusMessage = '';
	}

	function cancelExerciseEdit() {
		editingExerciseId = null;
		editExerciseName = '';
		editExerciseThemeId = '';
	}

	async function saveExerciseEdit(exerciseId: number) {
		errorMessage = '';
		statusMessage = '';

		try {
			await updateExercise(exerciseId, editExerciseName, editExerciseThemeId ? Number(editExerciseThemeId) : null);
			cancelExerciseEdit();
			await refreshAll();
			statusMessage = 'Exercise updated.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to update exercise.';
		}
	}

	function toggleExercise(exerciseId: number, checked: boolean) {
		if (checked) {
			selectedExerciseIds = [...selectedExerciseIds, exerciseId];
			return;
		}

		selectedExerciseIds = selectedExerciseIds.filter((id) => id !== exerciseId);
	}

	function moveExercise(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= selectedExerciseIds.length) return;

		const updated = [...selectedExerciseIds];
		const swap = updated[index];
		updated[index] = updated[nextIndex];
		updated[nextIndex] = swap;
		selectedExerciseIds = updated;
	}

	async function persistDayPlan() {
		errorMessage = '';
		statusMessage = '';

		if (!selectedThemeId) {
			errorMessage = 'Choose a theme before saving this day plan.';
			return;
		}

		if (selectedExerciseIds.length === 0) {
			errorMessage = 'Pick at least one exercise for this day.';
			return;
		}

		await saveDayPlan(selectedDay, Number(selectedThemeId), selectedExerciseIds);
		statusMessage = 'Day plan saved.';
	}

	function getThemeName(themeId: number | null): string {
		if (!themeId) return 'No theme';
		return themes.find((theme) => theme.id === themeId)?.name ?? 'No theme';
	}

	function getExerciseName(exerciseId: number): string {
		return exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Unknown exercise';
	}
</script>

<div class="page">
	<section class="card">
		<h1>Program Setup</h1>
		<p>Define themes, add exercises, and map Monday-Friday plans.</p>
	</section>

	<section class="card">
		<h2>Themes</h2>
		<div class="field-row" style="margin-top: 0.7rem">
			<input placeholder="Upper Push" bind:value={newThemeName} />
			<button onclick={createTheme}>Add Theme</button>
		</div>

		<div class="list" style="margin-top: 0.7rem">
			{#if themes.length === 0}
				<p class="muted">No themes yet.</p>
			{:else}
				{#each themes as theme}
					<div class="list-item">
						<div style="flex: 1; min-width: 12rem">
							{#if editingThemeId === theme.id}
								<input bind:value={editThemeName} placeholder="Theme name" />
							{:else}
								<span>{theme.name}</span>
							{/if}
						</div>
						{#if theme.id}
							{#if editingThemeId === theme.id}
								<div class="inline-row tight">
									<button class="secondary" onclick={() => saveThemeEdit(theme.id!)}>Save</button>
									<button class="ghost" onclick={cancelThemeEdit}>Cancel</button>
								</div>
							{:else}
								<div class="inline-row tight">
									<button class="ghost" onclick={() => startThemeEdit(theme)}>Edit</button>
									<button class="danger" onclick={() => removeTheme(theme.id!)}>Delete</button>
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</section>

	<section class="card">
		<h2>Exercises</h2>
		<div class="field-row" style="margin-top: 0.7rem">
			<input placeholder="Chest Press" bind:value={newExerciseName} />
			<select bind:value={newExerciseThemeId}>
				<option value="">Optional theme</option>
				{#each themes as theme}
					<option value={theme.id}>{theme.name}</option>
				{/each}
			</select>
			<button onclick={createExercise}>Add Exercise</button>
		</div>

		<div class="list" style="margin-top: 0.7rem">
			{#if exercises.length === 0}
				<p class="muted">No exercises yet.</p>
			{:else}
				{#each exercises as exercise}
					<div class="list-item">
						<div style="flex: 1; min-width: 12rem">
							{#if editingExerciseId === exercise.id}
								<div class="field-row">
									<input bind:value={editExerciseName} placeholder="Exercise name" />
									<select bind:value={editExerciseThemeId}>
										<option value="">No theme</option>
										{#each themes as theme}
											<option value={theme.id}>{theme.name}</option>
										{/each}
									</select>
								</div>
							{:else}
								<div>
									<strong>{exercise.name}</strong>
									<span class="chip" style="margin-left: 0.4rem">{getThemeName(exercise.themeId)}</span>
								</div>
							{/if}
						</div>
						{#if exercise.id}
							{#if editingExerciseId === exercise.id}
								<div class="inline-row tight">
									<button class="secondary" onclick={() => saveExerciseEdit(exercise.id!)}>Save</button>
									<button class="ghost" onclick={cancelExerciseEdit}>Cancel</button>
								</div>
							{:else}
								<div class="inline-row tight">
									<button class="ghost" onclick={() => startExerciseEdit(exercise)}>Edit</button>
									<button class="danger" onclick={() => removeExercise(exercise.id!)}>Archive</button>
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</section>

	<section class="card">
		<h2>Monday-Friday Plan Builder</h2>
		<div class="field-row" style="margin-top: 0.7rem">
			<select
				bind:value={selectedDay}
				onchange={async (event) => {
					selectedDay = Number((event.currentTarget as HTMLSelectElement).value) as Weekday;
					await loadDayPlan(selectedDay);
				}}
			>
				{#each WEEKDAYS as weekday}
					<option value={weekday.value}>{weekday.label}</option>
				{/each}
			</select>

			<select bind:value={selectedThemeId}>
				<option value="">Select theme</option>
				{#each themes as theme}
					<option value={theme.id}>{theme.name}</option>
				{/each}
			</select>
		</div>

		<p class="muted" style="margin-top: 0.6rem">Warmup ({5} min cardio) and cooldown ({10} min walk) are always included.</p>

		<div class="list" style="margin-top: 0.7rem">
			{#each exercises as exercise}
				{#if exercise.id}
					<label class="list-item">
						<div>
							<input
								type="checkbox"
								checked={selectedExerciseIds.includes(exercise.id)}
									onchange={(event) =>
									toggleExercise(exercise.id!, (event.currentTarget as HTMLInputElement).checked)}
							/>
							<span style="margin-left: 0.45rem">{exercise.name}</span>
						</div>
						<span class="chip">{getThemeName(exercise.themeId)}</span>
					</label>
				{/if}
			{/each}
		</div>

		<h3 style="margin-top: 1rem">Exercise order</h3>
		<div class="list" style="margin-top: 0.5rem">
			{#if selectedExerciseIds.length === 0}
				<p class="muted">No exercises selected yet.</p>
			{:else}
				{#each selectedExerciseIds as exerciseId, index}
					<div class="list-item">
						<span>{index + 1}. {getExerciseName(exerciseId)}</span>
						<div class="inline-row tight">
							<button class="ghost" onclick={() => moveExercise(index, -1)}>Up</button>
							<button class="ghost" onclick={() => moveExercise(index, 1)}>Down</button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<div class="inline-row" style="margin-top: 0.9rem">
			<button class="secondary" onclick={persistDayPlan}>Save Day Plan</button>
			{#if statusMessage}
				<span class="success">{statusMessage}</span>
			{/if}
			{#if errorMessage}
				<span class="error">{errorMessage}</span>
			{/if}
		</div>
	</section>
</div>
