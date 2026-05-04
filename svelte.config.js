import adapter from '@sveltejs/adapter-static';

function getGithubPagesBasePath() {
	const repository = process.env.GITHUB_REPOSITORY;
	if (!repository) return '';

	const [owner, repo] = repository.split('/');
	if (!owner || !repo) return '';

	if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
		return '';
	}

	return `/${repo}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build'
		}),
		paths: {
			base: process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? getGithubPagesBasePath() : '')
		},
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
