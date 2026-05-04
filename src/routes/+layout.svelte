<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Gym Flow</title>
	<meta
		name="description"
		content="Mobile gym workout tracker with weekday routines, warmup/cooldown checkboxes, and last-weight hints."
	/>
	<meta name="theme-color" content="#d1581c" />
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<header class="topbar">
		<div class="brand">Gym Flow</div>
		<nav class="nav" aria-label="Main navigation">
			<a href={`${base}/`}>Home</a>
			<a href={`${base}/setup/`}>Setup</a>
			<a href={`${base}/workout/`}>Workout</a>
		</nav>
	</header>

	{@render children()}
</div>
