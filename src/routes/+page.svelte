<script lang="ts">
	import { base } from '$app/paths';
</script>

<div class="page">
	<section class="card">
		<h1>Lift With A Plan</h1>
		<p>
			Set up weekday themes and exercise lists once, then open the workout screen at the gym and
			track your sets with previous-weight guidance.
		</p>
	</section>

	<section class="card">
		<h2>How It Works</h2>
		<div class="list" style="margin-top: 0.7rem">
			<div class="list-item">
				<span>1. Build your Monday-Friday themes and exercise plans.</span>
			</div>
			<div class="list-item">
				<span>2. Open Today&apos;s Workout to see warmup, main work, and cooldown checkboxes.</span>
			</div>
			<div class="list-item">
				<span>3. Enter weights and save. Next session shows what you lifted last time.</span>
			</div>
		</div>
	</section>

	<section class="card">
		<div class="inline-row">
			<a href={`${base}/setup/`}><button>Start Setup</button></a>
			<a href={`${base}/workout/`}><button class="secondary">Open Workout</button></a>
		</div>
	</section>
</div>
